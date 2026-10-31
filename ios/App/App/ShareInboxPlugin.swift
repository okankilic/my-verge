import Foundation
import UIKit
import Capacitor

// Hands shares saved by the Share Extension (ios/App/ShareExtension) to src/services/shareInbox.ts.
// Each share waits in the App Group container as ShareInbox/<id>/share.json plus an optional image.jpg.
@objc(ShareInboxPlugin)
public class ShareInboxPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShareInboxPlugin"
    public let jsName = "ShareInbox"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPending", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.com.okankilic.myverge"

    private var inboxURL: URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: ShareInboxPlugin.appGroup)?
            .appendingPathComponent("ShareInbox", isDirectory: true)
    }

    override public func load() {
        // The extension can't open the app, so look for new shares whenever the user switches back to it
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func appDidBecomeActive() {
        if !shareFolders().isEmpty {
            notifyListeners("shareReceived", data: [:])
        }
    }

    @objc func getPending(_ call: CAPPluginCall) {
        var items: [JSValue] = []
        for folder in shareFolders() {
            var item = JSObject()
            if let data = try? Data(contentsOf: folder.appendingPathComponent("share.json")),
               let fields = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
                for (key, value) in fields { item[key] = value }
            }
            if let image = try? Data(contentsOf: folder.appendingPathComponent("image.jpg")) {
                item["imageBase64"] = image.base64EncodedString()
                item["imageMime"] = "image/jpeg"
            }
            try? FileManager.default.removeItem(at: folder)
            if !item.isEmpty { items.append(item) }
        }
        call.resolve(["items": items])
    }

    // Finished shares, oldest first (the extension names folders by timestamp and moves them in when complete)
    private func shareFolders() -> [URL] {
        guard let inbox = inboxURL,
              let folders = try? FileManager.default.contentsOfDirectory(
                at: inbox, includingPropertiesForKeys: nil, options: [.skipsHiddenFiles]
              )
        else { return [] }
        return folders.filter { $0.hasDirectoryPath }.sorted { $0.lastPathComponent < $1.lastPathComponent }
    }
}
