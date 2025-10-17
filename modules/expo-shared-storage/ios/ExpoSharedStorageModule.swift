import ExpoModulesCore
import Foundation

public class ExpoSharedStorageModule: Module {
  let sharedDefaults = UserDefaults(suiteName: "group.cafe.tolo.app")

  private static let isAppClip: Bool = {
    if let infoPlist = Bundle.main.infoDictionary, let _ = infoPlist["NSAppClip"] as? [String: Any] {
      return true
    }
    return false
  }()

  public func definition() -> ModuleDefinition {
    Name("ExpoSharedStorage")

    Constants([
      "isAppClip": ExpoSharedStorageModule.isAppClip
    ])

    Function("setString") { (key: String, value: String) in
      self.sharedDefaults?.set(value, forKey: key)
      self.sharedDefaults?.synchronize()
    }

    Function("setNumber") { (key: String, value: Int) in
      self.sharedDefaults?.set(value, forKey: key)
      self.sharedDefaults?.synchronize()
    }

    Function("getString") { (key: String) -> String? in
      return self.sharedDefaults?.string(forKey: key)
    }

    Function("getNumber") { (key: String) -> Int? in
      return self.sharedDefaults?.integer(forKey: key)
    }
  }
}

