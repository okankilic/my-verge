import UIKit
import Capacitor

// Registers the app's own plugins, which Capacitor doesn't discover from node_modules
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ShareInboxPlugin())
    }
}
