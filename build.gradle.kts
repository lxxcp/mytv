import com.android.build.gradle.internal.api.BaseVariantOutputImpl
import com.android.build.gradle.internal.dsl.BaseAppModuleExtension
import com.android.build.gradle.tasks.PackageAndroidArtifact

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}

allprojects {
    val appConfig: BaseAppModuleExtension.() -> Unit = {
        signingConfigs {
            create("release") {
                storeFile = file(System.getenv("KEYSTORE") ?: "keystore.p12")
                storeType = System.getenv("KEYSTORE_TYPE") ?: "PKCS12"
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: ""
                keyPassword = System.getenv("KEY_PASSWORD") ?: ""
            }
        }

        buildTypes {
            getByName("release") {
                signingConfig = signingConfigs.getByName("release")
                isMinifyEnabled = true
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            }
        }

        applicationVariants.all {
            outputs.all {
                val ver = defaultConfig.versionName
                val minSdk = defaultConfig.minSdk
                val abi = filters.find { it.filterType == "ABI" }?.identifier ?: "all"
                (this as BaseVariantOutputImpl).outputFileName =
                    "mytv-android-${project.name}-$ver-${abi}-sdk$minSdk-release.apk"
            }
        }
    }

    extra["appConfig"] = appConfig

    tasks.withType<PackageAndroidArtifact>().configureEach {
        doLast {
            val outputDir = outputDirectory.get().asFile
            val targetDir = file("$outputDir/../../release")
            targetDir.mkdirs()
            
            println("=== 生成的APK文件 ===")
            outputDir.listFiles { file -> file.extension == "apk" }?.forEach { apkFile ->
                println("发现APK: ${apkFile.absolutePath}")
                apkFile.copyTo(file("${targetDir}/${apkFile.name}"), overwrite = true)
            }
        }
    }
}