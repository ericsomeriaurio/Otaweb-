"""Ajustes no projeto Android gerado pelo Capacitor (rodado automaticamente pelo GitHub ao montar o APK):
permissões, ícone das notificações e arquivo do Firebase (google-services.json)."""
import os, re, shutil

man = 'android/app/src/main/AndroidManifest.xml'
s = open(man, encoding='utf-8').read()
perms = ['CAMERA', 'RECORD_AUDIO', 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS']
add = ''.join('\n    <uses-permission android:name="android.permission.%s" />' % p for p in perms if 'android.permission.%s"' % p not in s)
inet = '<uses-permission android:name="android.permission.INTERNET" />'
s = s.replace(inet, inet + add, 1) if inet in s else s.replace('</manifest>', add + '\n</manifest>', 1)
meta = '''
        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_otaweb" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/ic_launcher_background" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="default" />'''
if 'default_notification_icon' not in s:
    s = re.sub(r'(<application\b[^>]*>)', lambda m: m.group(1) + meta, s, count=1)
open(man, 'w', encoding='utf-8').write(s)

gs = 'google-services.json'
if os.path.exists(gs):
    shutil.copy(gs, 'android/app/google-services.json'); print('google-services.json copiado: notificações ATIVADAS neste APK')
else:
    print('AVISO: google-services.json não encontrado. Este APK será gerado SEM notificações.')

root = 'android/build.gradle'
r = open(root, encoding='utf-8').read()
if 'com.google.gms:google-services' not in r:
    r2 = re.sub(r"(classpath ['\"]com\.android\.tools\.build:gradle:[^'\"]+['\"])", r"\1\n        classpath 'com.google.gms:google-services:4.4.2'", r, count=1)
    open(root, 'w', encoding='utf-8').write(r2)
app = 'android/app/build.gradle'
a = open(app, encoding='utf-8').read()
if os.path.exists(gs) and 'google-services' not in a:
    open(app, 'w', encoding='utf-8').write(a + "\napply plugin: 'com.google.gms.google-services'\n")
print('ajustes do Android concluídos')
