import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, refreshThemeColor } from '@/hooks/useColors';
import { readThemeColor, writeThemeColor, type ThemeColor } from '@/features/app-shell/themePreferences';
import { readLaunchPreferences, writeLaunchPreferences } from '@/features/app-shell/launchPreferences';
import { loadPasswordManagerPreferences, savePasswordManagerPreferences, type PasswordManagerPreferences } from '@/features/biometric-vault/passwordManagerPreferences';
import { readGreetingPreferences, writeGreetingPreferences, type GreetingMode } from '@/features/app-shell/greetingPreferences';
import { readSpiritualReminderPreferences, writeSpiritualReminderPreferences, type SpiritualReminderPreferences } from '@/features/spiritual/spiritualReminder';

const SETTINGS = [
  { title:'Language & preferences',description:'Language, accessibility and general preferences.',route:'/language-and-preference',icon:'globe' as const },
  { title:'Biometric Vault',description:'Manage secure biometric protection.',route:'/biometric-vault',icon:'shield' as const },
  { title:'Payment Announcer',description:'Configure secure payment announcements.',route:'/payment-announcer',icon:'volume-2' as const },
  { title:'Media Player Settings',description:'Advanced video, audio, subtitles, playback and live video-description controls.',route:'/media-player-settings',icon:'play-circle' as const },
  { title:'Expense Tracker',description:'Manage expense detection and financial privacy.',route:'/expense-tracker',icon:'credit-card' as const },

];
const LEGAL_SETTINGS = [
  {title:'Privacy Policy',description:'How Nexus Plus handles data, permissions, analytics, APIs and security.',route:'/privacy-policy',icon:'lock' as const},
  {title:'Terms & Conditions',description:'Rules for safe, lawful and responsible use of Nexus Plus.',route:'/terms-and-conditions',icon:'file-text' as const},
  {title:'About Nexus Wave Technologies',description:'Our mission, accessibility vision and the story behind Nexus Plus.',route:'/about-us',icon:'info' as const},
];
const THEME_OPTIONS:Array<{value:ThemeColor;title:string;description:string}>= [
 {value:'ocean-blue',title:'Ocean Blue',description:'Ocean blue with devotional gold accents, following Light or Dark appearance.'},
 {value:'classic',title:'Classic',description:'The original Nexus Plus green palette, following Light or Dark appearance.'},
 {value:'light',title:'Light Mode',description:'Always use a clean light palette.'},
 {value:'dark',title:'Dark Mode',description:'Always use a comfortable dark palette.'},
 {value:'system',title:'System Color',description:'Automatically follows your device Light or Dark appearance.'},
 {value:'material',title:'Material System',description:'Material-style semantic colors across features.'},
 {value:'black',title:'Black',description:'High-contrast black appearance for comfortable dark use.'},
 {value:'spiritual',title:'Spiritual Mode',description:'Devotional-inspired gold, saffron and deep-blue accents in Light and Dark themes.'},
];

export default function SettingsScreen(){
 const colors=useColors(); const router=useRouter(); const insets=useSafeAreaInsets();
 const [themeColor,setThemeColor]=useState<ThemeColor>('ocean-blue');
 const [passwordPrefs,setPasswordPrefs]=useState<PasswordManagerPreferences>({defaultGenerator:'nexus',showCopyAction:true,requireBiometricForReveal:true});
 const [greetingMode,setGreetingMode]=useState<GreetingMode>('radhe-radhe');
 const [spiritualPrefs,setSpiritualPrefs]=useState<SpiritualReminderPreferences>({enabled:true,intervalHours:5,startHour:8});
 const [launchPrefs,setLaunchPrefs]=useState<Awaited<ReturnType<typeof readLaunchPreferences>>>({launchTarget:'nexus-plus',homeDestination:'nexus-home',showGeetaNexusOnHome:true,showDiscoverOnHome:false});
 useEffect(()=>{void Promise.all([readLaunchPreferences(),readThemeColor(),loadPasswordManagerPreferences(),readGreetingPreferences(),readSpiritualReminderPreferences()]).then(([launch,theme,prefs,greeting,spiritual])=>{setLaunchPrefs(launch);setThemeColor(theme);setPasswordPrefs(prefs);setGreetingMode(greeting.mode);setSpiritualPrefs(spiritual);});},[]);
 const updateLaunchPrefs=(next: typeof launchPrefs)=>{setLaunchPrefs(next);void writeLaunchPreferences(next);};
 const updateThemeColor=async(theme:ThemeColor)=>{setThemeColor(theme);refreshThemeColor(theme);await writeThemeColor(theme);};
 const updatePasswordPrefs=(next:PasswordManagerPreferences)=>{setPasswordPrefs(next);void savePasswordManagerPreferences(next);};

 return <View style={[styles.root,{backgroundColor:colors.background}]}>
  <ScrollView contentContainerStyle={[styles.content,{paddingTop:insets.top+12,paddingBottom:insets.bottom+24}]}>
   <View style={styles.headerRow}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title,{color:colors.foreground}]}>Settings</Text><Text style={[styles.subtitle,{color:colors.mutedForeground}]}>Control Nexus Plus appearance and behavior.</Text></View></View>
   <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Password Manager</Text>
    <Text style={[styles.body,{color:colors.mutedForeground}]}>Choose which password generator is offered by default. Nexus Plus remains local until a future cloud provider is enabled.</Text>
    <View style={styles.modeList}>
      {(['nexus','google'] as const).map(provider=><Pressable key={provider} accessibilityRole="radio" accessibilityState={{selected:passwordPrefs.defaultGenerator===provider}} accessibilityLabel={'Default password generator: '+(provider==='nexus'?'Nexus Plus':'Google Passwords')} onPress={()=>updatePasswordPrefs({...passwordPrefs,defaultGenerator:provider})} style={[styles.modeItem,{borderColor:passwordPrefs.defaultGenerator===provider?colors.primary:colors.border,backgroundColor:passwordPrefs.defaultGenerator===provider?colors.secondary:colors.card}]}>
       <View style={[styles.radio,{borderColor:passwordPrefs.defaultGenerator===provider?colors.primary:colors.mutedForeground}]}>{passwordPrefs.defaultGenerator===provider?<View style={[styles.radioDot,{backgroundColor:colors.primary}]} />:null}</View>
       <View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{provider==='nexus'?'Nexus Plus Password Generator':'Google Passwords'}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{provider==='nexus'?'Generate and save in the encrypted local Vault.':'Use Google as the chosen password-management destination when Android supports it.'}</Text></View>
      </Pressable>)}
    </View>
    <Pressable accessibilityRole="switch" accessibilityState={{checked:passwordPrefs.requireBiometricForReveal}} onPress={()=>updatePasswordPrefs({...passwordPrefs,requireBiometricForReveal:!passwordPrefs.requireBiometricForReveal})} style={[styles.modeItem,{marginTop:10,borderColor:colors.border,backgroundColor:colors.card}]}>
      <Feather name={passwordPrefs.requireBiometricForReveal?'lock':'unlock'} size={19} color={colors.primary}/>
      <View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>Biometric before reveal/copy</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Sensitive passwords request Vault authentication before reveal or copy.</Text></View>
      <Text style={[styles.toggle,{color:colors.primary}]}>{passwordPrefs.requireBiometricForReveal?'On':'Off'}</Text>
    </Pressable>
   </View>
   <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Choose Theme Color</Text>
    <Text style={[styles.body,{color:colors.mutedForeground}]}>One semantic palette is shared across every feature.</Text>
    <View style={styles.modeList}>{THEME_OPTIONS.map(option=><Pressable key={option.value} accessibilityRole="radio" accessibilityState={{selected:themeColor===option.value}} accessibilityLabel={option.title+'. '+option.description} onPress={()=>void updateThemeColor(option.value)} style={[styles.modeItem,{borderColor:themeColor===option.value?colors.primary:colors.border,backgroundColor:themeColor===option.value?colors.secondary:colors.card}]}>
      <View style={[styles.radio,{borderColor:themeColor===option.value?colors.primary:colors.mutedForeground}]}>{themeColor===option.value?<View style={[styles.radioDot,{backgroundColor:colors.primary}]} />:null}</View>
      <View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{option.title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{option.description}</Text></View>
    </Pressable>)}</View>
   </View>
   <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Home Greeting</Text>
    <Text style={[styles.body,{color:colors.mutedForeground}]}>Choose the single greeting shown at the top of Home. Launch greeting remains “Jai Shri Krishna”.</Text>
    <View style={styles.modeList}>{([
      ['radhe-radhe','Radhe Radhe'],['jai-shri-krishna','Jai Shri Krishna'],['hare-krishna','Hare Krishna'],['good-day','Good Morning'],['namaste','Namaste'],['hari-om','Hari Om'],['shri-radhe','Shri Radhe'],['govinda','Hare Govinda'],['time-aware','Time-based greeting']
    ] as Array<[GreetingMode,string]>).map(([value,title])=><Pressable key={value} accessibilityRole="radio" accessibilityState={{selected:greetingMode===value}} accessibilityLabel={title} onPress={()=>{setGreetingMode(value);void writeGreetingPreferences({mode:value});}} style={[styles.modeItem,{borderColor:greetingMode===value?colors.primary:colors.border,backgroundColor:greetingMode===value?colors.secondary:colors.card}]}><View style={[styles.radio,{borderColor:greetingMode===value?colors.primary:colors.mutedForeground}]}>{greetingMode===value?<View style={[styles.radioDot,{backgroundColor:colors.primary}]} />:null}</View><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{title}</Text></View></Pressable>)}</View>
   </View>
   <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Select App Mode</Text>
    <Text style={[styles.body,{color:colors.mutedForeground}]}>Choose which experience opens after login. The selected app name is also used in the app shell.</Text>
    <View style={styles.modeList}>
      {([['nexus-home','Nexus Plus Home'],['geeta-home','Geeta Nexus']] as const).map(([value,title])=><Pressable key={value} accessibilityRole="radio" accessibilityState={{selected:launchPrefs.homeDestination===value}} onPress={()=>updateLaunchPrefs({...launchPrefs,homeDestination:value})} style={[styles.modeItem,{borderColor:launchPrefs.homeDestination===value?colors.primary:colors.border,backgroundColor:launchPrefs.homeDestination===value?colors.secondary:colors.card}]}><View style={[styles.radio,{borderColor:launchPrefs.homeDestination===value?colors.primary:colors.mutedForeground}]}>{launchPrefs.homeDestination===value?<View style={[styles.radioDot,{backgroundColor:colors.primary}]} />:null}</View><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{title}</Text></View></Pressable>)}
    </View>
    <Text style={[styles.appModeNote,{color:colors.mutedForeground}]}>Geeta Nexus mode uses the integrated Bhagavad Gita experience.</Text>
    <Pressable accessibilityRole="switch" accessibilityState={{checked:launchPrefs.showGeetaNexusOnHome}} onPress={()=>updateLaunchPrefs({...launchPrefs,showGeetaNexusOnHome:!launchPrefs.showGeetaNexusOnHome})} style={styles.modeItem}><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>Show Geeta Access on Home</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>Keep the Geeta Access shortcut visible on the selected Home screen.</Text></View><Text style={[styles.toggle,{color:colors.primary}]}>{launchPrefs.showGeetaNexusOnHome?'On':'Off'}</Text></Pressable>
   </View>
   <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Geeta Nexus Messages</Text>
    <Text style={[styles.body,{color:colors.mutedForeground}]}>Receive optional local Gita/spiritual messages during the day. The app never requires you to read a verse to use Nexus Plus.</Text>
    <Pressable accessibilityRole="switch" accessibilityState={{checked:spiritualPrefs.enabled}} onPress={()=>{const next={...spiritualPrefs,enabled:!spiritualPrefs.enabled};setSpiritualPrefs(next);void writeSpiritualReminderPreferences(next);}} style={styles.modeItem}>
      <View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>Spiritual reminders</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>On-device notifications with Gita verses or reflections.</Text></View>
      <Text style={[styles.toggle,{color:colors.primary}]}>{spiritualPrefs.enabled?'On':'Off'}</Text>
    </Pressable>
    <View style={styles.modeList}>
      {([4,5,6,8] as const).map(hours=><Pressable key={hours} accessibilityRole="radio" accessibilityState={{selected:spiritualPrefs.intervalHours===hours}} onPress={()=>{const next={...spiritualPrefs,intervalHours:hours};setSpiritualPrefs(next);void writeSpiritualReminderPreferences(next);}} style={[styles.modeItem,{borderColor:spiritualPrefs.intervalHours===hours?colors.primary:colors.border,backgroundColor:spiritualPrefs.intervalHours===hours?colors.secondary:colors.card}]}>
       <View style={[styles.radio,{borderColor:spiritualPrefs.intervalHours===hours?colors.primary:colors.mutedForeground}]}>{spiritualPrefs.intervalHours===hours?<View style={[styles.radioDot,{backgroundColor:colors.primary}]} />:null}</View>
       <View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{hours} hour interval</Text></View>
      </Pressable>)}
    </View>
   </View>
      <Text style={[styles.sectionTitle,{color:colors.foreground,marginTop:20}]}>Feature settings</Text>
   <View style={styles.list}>{SETTINGS.map(item=><Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.title+'. '+item.description} onPress={()=>router.push(item.route as never)} style={[styles.item,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name={item.icon} size={19} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{item.title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{item.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground}/>
   </Pressable>)}</View>
   <Text style={[styles.sectionTitle,{color:colors.foreground,marginTop:22}]}>Privacy & About</Text>
   <View style={styles.list}>{LEGAL_SETTINGS.map(item=><Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.title+'. '+item.description} onPress={()=>router.push(item.route as never)} style={[styles.item,{backgroundColor:colors.card,borderColor:colors.border}]}>
    <View style={[styles.icon,{backgroundColor:colors.secondary}]}><Feather name={item.icon} size={19} color={colors.primary}/></View><View style={styles.copy}><Text style={[styles.rowTitle,{color:colors.foreground}]}>{item.title}</Text><Text style={[styles.body,{color:colors.mutedForeground}]}>{item.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground}/>
   </Pressable>)}</View>
  </ScrollView>
 </View>;
}

const styles=StyleSheet.create({
 root:{flex:1},content:{paddingHorizontal:18},headerRow:{flexDirection:'row',alignItems:'center',marginBottom:4},copy:{flex:1,marginRight:12},title:{fontSize:28,fontFamily:'Inter_700Bold',marginBottom:6},subtitle:{fontSize:12,lineHeight:18},
 card:{marginTop:18,borderRadius:18,borderWidth:1,padding:16},sectionTitle:{fontSize:15,fontFamily:'Inter_700Bold',marginBottom:8},body:{fontSize:11,lineHeight:16},list:{gap:10},modeList:{gap:10,marginTop:8},modeItem:{minHeight:72,borderRadius:15,borderWidth:1,padding:12,flexDirection:'row',alignItems:'center'},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:'center',justifyContent:'center'},radioDot:{width:10,height:10,borderRadius:5},rowTitle:{fontSize:13,fontFamily:'Inter_700Bold',marginBottom:3},toggle:{fontSize:11,fontFamily:'Inter_700Bold'},item:{minHeight:70,borderRadius:17,borderWidth:1,padding:13,flexDirection:'row',alignItems:'center'},icon:{width:43,height:43,borderRadius:13,alignItems:'center',justifyContent:'center'}
});
