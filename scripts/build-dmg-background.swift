import AppKit

let root = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent().deletingLastPathComponent()
let output = root.appendingPathComponent("build/dmg")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
func text(_ value: String, _ y: CGFloat, _ size: CGFloat, _ weight: NSFont.Weight, _ color: NSColor) {
    let p = NSMutableParagraphStyle(); p.alignment = .center
    (value as NSString).draw(in: NSRect(x: 28, y: y, width: 584, height: 40), withAttributes: [
        .font: NSFont.systemFont(ofSize: size, weight: weight), .foregroundColor: color, .paragraphStyle: p])
}
for scale in [1, 2] {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 640 * scale, pixelsHigh: 420 * scale,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0)!
    let cg = NSGraphicsContext(bitmapImageRep: bitmap)!.cgContext
    cg.translateBy(x: 0, y: CGFloat(420 * scale)); cg.scaleBy(x: CGFloat(scale), y: -CGFloat(scale))
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)
    NSColor(calibratedWhite: 0.97, alpha: 1).setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: 640, height: 420)).fill()
    let ink = NSColor(calibratedWhite: 0.12, alpha: 1)
    let muted = NSColor(calibratedWhite: 0.38, alpha: 1)
    text("DoTwo VTR", 35, 27, .semibold, ink)
    text("Arrastra la app a Aplicaciones", 80, 18, .regular, muted)
    let arrow = NSBezierPath()
    arrow.move(to: NSPoint(x: 280, y: 202)); arrow.line(to: NSPoint(x: 356, y: 202))
    arrow.move(to: NSPoint(x: 338, y: 184)); arrow.line(to: NSPoint(x: 356, y: 202)); arrow.line(to: NSPoint(x: 338, y: 220))
    arrow.lineWidth = 4; arrow.lineCapStyle = .round; arrow.lineJoinStyle = .round
    NSColor(calibratedRed: 0.04, green: 0.45, blue: 0.98, alpha: 1).setStroke(); arrow.stroke()
    text("Cuando termine la copia, expulsa esta imagen.", 335, 14, .regular, muted)
    text("Abre DoTwo VTR desde Aplicaciones.", 360, 14, .regular, muted)
    NSGraphicsContext.restoreGraphicsState()
    try bitmap.representation(using: .png, properties: [:])!.write(to: output.appendingPathComponent(scale == 1 ? "background.png" : "background@2x.png"))
}
