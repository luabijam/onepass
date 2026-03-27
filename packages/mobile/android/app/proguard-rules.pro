# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep native modules
-keep class com.onepass.** { *; }

# Keep keychain/biometrics
-keep class com.oblador.keychain.** { *; }
-keep class com.rnbiometrics.** { *; }

# Keep vector icons
-keep class com.oblador.vectoricons.** { *; }

# Keep async storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep clipboard
-keep class com.reactnativecommunity.clipboard.** { *; }

# Keep safe area context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Keep screens
-keep class com.swmansion.rnscreens.** { *; }

# General React Native optimizations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
-dontwarn com.facebook.**
