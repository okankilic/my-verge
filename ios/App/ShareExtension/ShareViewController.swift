import UIKit
import ImageIO
import UniformTypeIdentifiers

// Saves a shared link, text or photo for Make It Real (ShareInboxPlugin picks it up when the app comes forward)
class ShareViewController: UIViewController {
    private let appGroup = "group.com.okankilic.myverge"
    private let maxImagePixels = 1600
    private var finished = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.black.withAlphaComponent(0.2)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        Task { @MainActor in
            let saved = await saveShare()
            showConfirmation(saved ? "Saved! Open Make It Real to finish your wish." : "Sorry, that couldn't be saved.")
        }
    }

    private func saveShare() async -> Bool {
        let items = extensionContext?.inputItems as? [NSExtensionItem] ?? []
        var fields: [String: String] = [:]
        if let subject = items.first?.attributedTitle?.string, !subject.isEmpty { fields["subject"] = subject }
        var image: Data?

        for provider in items.flatMap({ $0.attachments ?? [] }) {
            if image == nil, provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                image = await loadImage(provider)
            } else if fields["url"] == nil, provider.hasItemConformingToTypeIdentifier(UTType.url.identifier),
                      let url = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL,
                      !url.isFileURL {
                fields["url"] = url.absoluteString
            } else if fields["text"] == nil, provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier),
                      let text = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) as? String {
                fields["text"] = text
            }
        }
        if fields["text"] == nil, let text = items.first?.attributedContentText?.string, !text.isEmpty {
            fields["text"] = text
        }
        guard !fields.isEmpty || image != nil else { return false }
        return write(fields: fields, image: image)
    }

    // Downscale with ImageIO so a big photo never has to be decoded whole (extensions get little memory)
    private func loadImage(_ provider: NSItemProvider) async -> Data? {
        guard let item = try? await provider.loadItem(forTypeIdentifier: UTType.image.identifier) else { return nil }
        let source: CGImageSource?
        if let url = item as? URL {
            source = CGImageSourceCreateWithURL(url as CFURL, nil)
        } else if let data = item as? Data {
            source = CGImageSourceCreateWithData(data as CFData, nil)
        } else if let uiImage = item as? UIImage, let data = uiImage.jpegData(compressionQuality: 0.9) {
            source = CGImageSourceCreateWithData(data as CFData, nil)
        } else {
            source = nil
        }
        guard let source else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maxImagePixels,
        ]
        guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
        return UIImage(cgImage: cgImage).jpegData(compressionQuality: 0.8)
    }

    // Write into a temp folder, then move it into the inbox, so the app never reads a half-written share
    private func write(fields: [String: String], image: Data?) -> Bool {
        let fm = FileManager.default
        guard let container = fm.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return false }
        let inbox = container.appendingPathComponent("ShareInbox", isDirectory: true)
        let name = "\(Int(Date().timeIntervalSince1970 * 1000))-\(UUID().uuidString)"
        let staging = container.appendingPathComponent(".staging-\(name)", isDirectory: true)
        do {
            try fm.createDirectory(at: inbox, withIntermediateDirectories: true)
            try fm.createDirectory(at: staging, withIntermediateDirectories: true)
            try JSONSerialization.data(withJSONObject: fields).write(to: staging.appendingPathComponent("share.json"))
            if let image { try image.write(to: staging.appendingPathComponent("image.jpg")) }
            try fm.moveItem(at: staging, to: inbox.appendingPathComponent(name, isDirectory: true))
            return true
        } catch {
            try? fm.removeItem(at: staging)
            return false
        }
    }

    private func showConfirmation(_ message: String) {
        let card = UIView()
        card.backgroundColor = .systemBackground
        card.layer.cornerRadius = 16
        card.translatesAutoresizingMaskIntoConstraints = false

        let label = UILabel()
        label.text = message
        label.numberOfLines = 0
        label.textAlignment = .center
        label.font = .preferredFont(forTextStyle: .body)
        label.translatesAutoresizingMaskIntoConstraints = false

        let done = UIButton(type: .system)
        done.setTitle("Done", for: .normal)
        done.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        done.translatesAutoresizingMaskIntoConstraints = false
        done.addTarget(self, action: #selector(finish), for: .touchUpInside)

        card.addSubview(label)
        card.addSubview(done)
        view.addSubview(card)
        NSLayoutConstraint.activate([
            card.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            card.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            card.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
            label.topAnchor.constraint(equalTo: card.topAnchor, constant: 24),
            label.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            label.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),
            done.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 12),
            done.centerXAnchor.constraint(equalTo: card.centerXAnchor),
            done.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            done.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -12),
        ])
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in self?.finish() }
    }

    @objc private func finish() {
        guard !finished else { return }
        finished = true
        extensionContext?.completeRequest(returningItems: nil)
    }
}
