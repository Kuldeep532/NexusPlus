package com.nexuswavetech.nexusplus

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.util.DisplayMetrics
import androidx.core.app.NotificationCompat
import java.io.ByteArrayOutputStream
import java.io.OutputStream
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import java.util.Collections
import java.util.UUID
import kotlin.math.min

class NexusScreenMirrorService : Service() {
    companion object {
        private const val CHANNEL_ID = "nexus_screen_mirroring"
        private const val NOTIFICATION_ID = 9401
        private const val PORT = 8765
        private const val EXTRA_RESULT_CODE = "resultCode"
        private const val EXTRA_DATA = "projectionData"
        @Volatile var isProjectionActive = false
        @Volatile var isMediaActive = false
        @Volatile private var latestJpeg: ByteArray? = null
        @Volatile private var frameVersion = 0L
        @Volatile private var currentUri: String? = null
        @Volatile private var currentMime: String? = null
        @Volatile private var currentKind = "video"
        @Volatile private var currentName: String? = null
        @Volatile private var currentTarget = "computer"
        @Volatile private var token: String? = null
        private var projection: MediaProjection? = null
        private var virtualDisplay: VirtualDisplay? = null
        private var imageReader: ImageReader? = null
        private var worker: HandlerThread? = null
        private var workerHandler: Handler? = null
        private var server: ServerSocket? = null
        private var serverThread: Thread? = null
        private var instance: NexusScreenMirrorService? = null

        fun startProjection(context: Context, resultCode: Int, data: Intent) {
            val intent = Intent(context, NexusScreenMirrorService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_DATA, data)
                putExtra("projectionStart", true)
            }
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
        }

        fun castMedia(context: Context, target: String, uri: String, mimeType: String?, kind: String, name: String?, durationMs: Double?): com.facebook.react.bridge.WritableMap {
            isMediaActive = true
            currentTarget = target
            currentUri = uri
            currentMime = mimeType
            currentKind = kind
            currentName = name
            ensureServer(context)
            ensureMediaForeground()
            val url = mediaUrl()
            val tvLoaded = if (target == "tv" && url != null) {
                try { NexusTvCastModule.loadMediaOnCurrentSession(context, url, mimeType, name, kind, durationMs) } catch (_: Exception) { false }
            } else false
            return statusMap(url, tvLoaded)
        }

        fun replaceCastMedia(context: Context, uri: String, mimeType: String?, kind: String, name: String?, durationMs: Double?): com.facebook.react.bridge.WritableMap {
            if (!isMediaActive) throw IllegalStateException("No media cast session is active.")
            currentUri = uri
            currentMime = mimeType
            currentKind = kind
            currentName = name
            frameVersion++
            val url = mediaUrl()
            val tvLoaded = if (currentTarget == "tv" && url != null) {
                try { NexusTvCastModule.loadMediaOnCurrentSession(context, url, mimeType, name, kind, durationMs) } catch (_: Exception) { false }
            } else false
            return statusMap(url, tvLoaded)
        }

        fun stopProjection(context: Context) { try { context.stopService(Intent(context, NexusScreenMirrorService::class.java)) } catch (_: Exception) {}; isProjectionActive = false }

        fun stopMedia(context: Context) {
            try {
                com.google.android.gms.cast.framework.CastContext.getSharedInstance(context).sessionManager.currentCastSession?.remoteMediaClient?.stop()
            } catch (_: Exception) {}
            currentUri = null; currentMime = null; currentName = null; isMediaActive = false
            if (!isProjectionActive) try { context.stopService(Intent(context, NexusScreenMirrorService::class.java)) } catch (_: Exception) {}
        }

        fun stopAll(context: Context) { stopMedia(context); stopProjection(context) }

        fun receiverUrl(context: Context): String? {
            if (!isProjectionActive && !isMediaActive) return null
            ensureServer(context)
            return baseUrl()
        }

        private fun statusMap(url: String?, tvLoaded: Boolean) = com.facebook.react.bridge.Arguments.createMap().apply {
            putString("receiverUrl", url); putBoolean("tvLoaded", tvLoaded); putBoolean("active", true); putString("target", currentTarget); putString("kind", currentKind)
        }

        private fun localIp(): String? = try {
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (network in interfaces) {
                if (!network.isUp || network.isLoopback) continue
                for (address in Collections.list(network.inetAddresses)) {
                    val host = address.hostAddress ?: continue
                    if (!host.contains(":") && host != "127.0.0.1") return host
                }
            }
            null
        } catch (_: Exception) { null }

        private fun baseUrl(): String? = localIp()?.let { "http://$it:$PORT/?token=${token ?: ""}" }
        private fun mediaUrl(): String? = localIp()?.let { "http://$it:$PORT/media?token=${token ?: ""}" }
        private fun screenUrl(): String? = localIp()?.let { "http://$it:$PORT/screen.mjpeg?token=${token ?: ""}" }

        private fun ensureServer(context: Context) {
            if (server?.isClosed == false) return
            synchronized(this) {
                if (server?.isClosed == false) return
                token = UUID.randomUUID().toString().replace("-", "")
                server = ServerSocket(PORT)
                serverThread = Thread {
                    while (server?.isClosed == false) {
                        try { server?.accept()?.let { client -> Thread { handleClient(context.applicationContext, client) }.start() } } catch (_: Exception) { break }
                    }
                }.apply { isDaemon = true; name = "NexusMirrorHttp"; start() }
            }
        }

        private fun handleClient(context: Context, socket: Socket) {
            socket.use {
                try {
                    val line = it.getInputStream().bufferedReader().readLine() ?: return
                    val parts = line.split(" "); if (parts.size < 2) return
                    val target = parts[1]; val query = target.substringAfter("?", "")
                    if (queryParam(query, "token") != token) { writeText(it.getOutputStream(), 403, "Forbidden"); return }
                    when (target.substringBefore("?")) {
                        "/" -> writeReceiverHtml(it.getOutputStream())
                        "/state" -> writeJson(it.getOutputStream(), currentState())
                        "/media" -> serveMedia(context, it.getOutputStream())
                        "/screen.mjpeg" -> serveMjpeg(it.getOutputStream())
                        else -> writeText(it.getOutputStream(), 404, "Not found")
                    }
                } catch (_: Exception) {}
            }
        }

        private fun writeReceiverHtml(out: OutputStream) {
            val t = token ?: ""
            val html = """<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>Nexus Plus Receiver</title><style>html,body{margin:0;width:100%;height:100%;background:#000;color:#fff;font-family:system-ui}body{display:flex;align-items:center;justify-content:center}.m{max-width:100%;max-height:100%;object-fit:contain}#s{position:fixed;left:12px;bottom:12px;background:#111d;padding:8px 12px;border-radius:8px}</style></head><body><img id='i' class='m' hidden><video id='v' class='m' controls autoplay playsinline hidden></video><div id='s'>Waiting for Nexus Plus…</div><script>const token='$t';let last='';async function tick(){try{const s=await (await fetch('/state?token='+encodeURIComponent(token),{cache:'no-store'})).json(),i=document.getElementById('i'),v=document.getElementById('v'),st=document.getElementById('s');if(s.mode==='screen'){i.hidden=false;v.hidden=true;let n=s.url+'#'+s.version;if(last!==n){i.src=n;last=n}st.textContent='Nexus screen mirror';return}if(!s.active){i.hidden=true;v.hidden=true;st.textContent='Waiting for Nexus Plus…';return}st.textContent='Nexus Plus · '+(s.name||'Casting');if(s.kind==='image'){v.pause();v.hidden=true;i.hidden=false;let n=s.url+'&v='+s.version;if(last!==n){i.src=n;last=n}}else{i.hidden=true;v.hidden=false;let n=s.url+'&v='+s.version;if(last!==n){v.src=n;v.play().catch(()=>{});last=n}}}catch(e){document.getElementById('s').textContent='Receiver reconnecting…'}}setInterval(tick,1000);tick();</script></body></html>"""
            val b = html.toByteArray(); out.write("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ${b.size}\r\nConnection: close\r\n\r\n".toByteArray()); out.write(b)
        }

        private fun currentState() = if (isProjectionActive) {
            """{"active":true,"mode":"screen","kind":"screen","name":"Nexus Screen","url":"${screenUrl() ?: ""}","version":$frameVersion}"""
        } else {
            """{"active":${isMediaActive && currentUri != null},"mode":"media","kind":"${escape(currentKind)}","name":"${escape(currentName ?: "Nexus Plus Cast")}","url":"${mediaUrl() ?: ""}","version":$frameVersion}"""
        }

        private fun serveMedia(context: Context, out: OutputStream) {
            val value = currentUri ?: return writeText(out, 404, "No media selected")
            val uri = android.net.Uri.parse(value); val mime = currentMime ?: context.contentResolver.getType(uri) ?: "application/octet-stream"
            val input = context.contentResolver.openInputStream(uri) ?: return writeText(out, 404, "Media unavailable")
            input.use { out.write("HTTP/1.1 200 OK\r\nContent-Type: $mime\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n".toByteArray()); val buffer=ByteArray(65536); while(true){val n=it.read(buffer); if(n<=0) break; out.write(buffer,0,n)}; out.flush() }
        }

        private fun serveMjpeg(out: OutputStream) {
            out.write("HTTP/1.1 200 OK\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n".toByteArray())
            var sent=-1L; while(isProjectionActive){val jpeg=latestJpeg; val version=frameVersion; if(jpeg!=null && version!=sent){out.write("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${jpeg.size}\r\n\r\n".toByteArray()); out.write(jpeg); out.write("\r\n".toByteArray()); out.flush(); sent=version}; Thread.sleep(80)}
        }

        private fun createProjection(context: Context, resultCode: Int, data: Intent) {
            val manager=context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            projection?.stop(); projection=manager.getMediaProjection(resultCode,data)
            worker=HandlerThread("NexusMirrorFrames").also{it.start()}; workerHandler=Handler(worker!!.looper)
            val metrics=DisplayMetrics(); @Suppress("DEPRECATION") (context.getSystemService(Context.WINDOW_SERVICE) as android.view.WindowManager).defaultDisplay.getRealMetrics(metrics)
            val scale=min(1.0,1280.0/metrics.widthPixels.toDouble()); val width=(metrics.widthPixels*scale).toInt().coerceAtLeast(320); val height=(metrics.heightPixels*scale).toInt().coerceAtLeast(240)
            imageReader=ImageReader.newInstance(width,height,android.graphics.PixelFormat.RGBA_8888,2)
            imageReader?.setOnImageAvailableListener({reader->reader.acquireLatestImage()?.use{image->try{val p=image.planes[0]; val bw=width+((p.rowStride-p.pixelStride*width)/p.pixelStride); val bitmap=Bitmap.createBitmap(bw,height,Bitmap.Config.ARGB_8888); bitmap.copyPixelsFromBuffer(p.buffer); val cropped=if(bw!=width) Bitmap.createBitmap(bitmap,0,0,width,height) else bitmap; val bytes=ByteArrayOutputStream(); cropped.compress(Bitmap.CompressFormat.JPEG,65,bytes); latestJpeg=bytes.toByteArray(); frameVersion++; if(cropped!==bitmap) bitmap.recycle(); cropped.recycle()}catch(_:Exception){}}},workerHandler)
            virtualDisplay=projection?.createVirtualDisplay("NexusScreenMirror",width,height,metrics.densityDpi,DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,imageReader!!.surface,null,workerHandler)
            projection?.registerCallback(object:MediaProjection.Callback(){override fun onStop(){isProjectionActive=false;virtualDisplay?.release();virtualDisplay=null;imageReader?.close();imageReader=null;latestJpeg=null}},workerHandler)
            isProjectionActive=true; ensureServer(context); frameVersion++
        }

        private fun ensureForeground(service:NexusScreenMirrorService,projectionMode:Boolean){
            val manager=service.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager; manager.createNotificationChannel(NotificationChannel(CHANNEL_ID,"Nexus Screen Mirroring",NotificationManager.IMPORTANCE_LOW))
            val pi=PendingIntent.getBroadcast(service,1,Intent(service,NexusScreenMirrorStopReceiver::class.java),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val notification=NotificationCompat.Builder(service,CHANNEL_ID).setSmallIcon(android.R.drawable.ic_menu_view).setContentTitle("Nexus Screen Mirroring").setContentText(if(projectionMode) "Screen sharing is active" else "Media casting is active").setOngoing(true).addAction(android.R.drawable.ic_media_pause,"Stop Casting",pi).build()
            if(Build.VERSION.SDK_INT>=29){val type=if(projectionMode) android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION else android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK; service.startForeground(NOTIFICATION_ID,notification,type)}else service.startForeground(NOTIFICATION_ID,notification)
        }
        private fun ensureMediaForeground(){instance?.let{ensureForeground(it,false)}}
        private fun queryParam(query:String,name:String):String?=query.split("&").firstOrNull{it.startsWith("$name=")}?.substringAfter("=")?.let{URLDecoder.decode(it,"UTF-8")}
        private fun writeJson(out:OutputStream,body:String){val b=body.toByteArray();out.write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${b.size}\r\nConnection: close\r\n\r\n".toByteArray());out.write(b)}
        private fun writeText(out:OutputStream,code:Int,message:String){val b=message.toByteArray();out.write("HTTP/1.1 $code Error\r\nContent-Type: text/plain\r\nContent-Length: ${b.size}\r\nConnection: close\r\n\r\n".toByteArray());out.write(b)}
        private fun escape(v:String)=v.replace("\\","\\\\").replace("\"","\\\"")
    }

    override fun onCreate(){super.onCreate();instance=this;ensureServer(applicationContext)}
    private fun ensureServer(context:Context){ Companion.ensureServer(context) }
    override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int{
        if(intent?.getBooleanExtra("projectionStart",false)==true){Companion.ensureForeground(this,true);val code=intent.getIntExtra(EXTRA_RESULT_CODE,Int.MIN_VALUE);val data=if(Build.VERSION.SDK_INT>=33)intent.getParcelableExtra(EXTRA_DATA,Intent::class.java) else @Suppress("DEPRECATION") intent.getParcelableExtra(EXTRA_DATA);if(code!=Int.MIN_VALUE&&data!=null) Companion.createProjection(this,code,data)}
        else if(intent?.getBooleanExtra("mediaStart",false)==true) Companion.ensureForeground(this,false)
        return START_NOT_STICKY
    }
    override fun onDestroy(){try{projection?.stop()}catch(_:Exception){};projection=null;virtualDisplay?.release();virtualDisplay=null;imageReader?.close();imageReader=null;worker?.quitSafely();worker=null;workerHandler=null;latestJpeg=null;isProjectionActive=false;isMediaActive=false;server?.close();server=null;serverThread=null;if(instance===this)instance=null;super.onDestroy()}
    override fun onBind(intent:Intent?):IBinder?=null
}
