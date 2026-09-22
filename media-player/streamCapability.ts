import { resolveStream } from './streamProvider';

export async function validateStreamUri(uri: string, kind: 'audio' | 'video'): Promise<{supported:boolean;message?:string}> {
  const stream = resolveStream(uri);
  if (!stream) return {supported:false,message:kind === 'audio' ? 'This audio URL is not supported.' : 'This video URL is not supported.'};
  if (stream.protocol === 'hls') return {supported:true};
  if (kind === 'audio') {
    if (stream.mimeType?.startsWith('video/')) return {supported:false,message:'This audio URL is not supported.'};
    return {supported:true};
  }
  if (stream.mimeType?.startsWith('audio/')) return {supported:false,message:'This video URL is not supported.'};
  return {supported:true};
}
