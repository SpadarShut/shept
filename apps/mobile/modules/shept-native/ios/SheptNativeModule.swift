import ExpoModulesCore

public class SheptNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SheptNative")

    Function("isOverlayPermissionGranted") { () -> Bool in
      return false
    }

    Function("requestOverlayPermission") {}

    Function("isAccessibilityEnabled") { () -> Bool in
      return false
    }

    Function("openAccessibilitySettings") {}

    Function("isNotificationPermissionGranted") { () -> Bool in
      return false
    }

    Function("saveSettings") { (_: String) in }

    Function("getSettings") { () -> String? in
      return nil
    }

    Function("startOverlay") {}
    Function("stopOverlay") {}

    Function("getServiceStatus") { () -> String in
      return "idle"
    }
  }
}
