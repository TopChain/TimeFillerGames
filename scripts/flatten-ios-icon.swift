import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let arguments = CommandLine.arguments
 guard arguments.count == 3 else {
  fputs("Usage: swift flatten-ios-icon.swift <input.png> <output.png>\n", stderr)
  exit(64)
}

let inputURL = URL(fileURLWithPath: arguments[1])
let outputURL = URL(fileURLWithPath: arguments[2])

guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
      let input = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
  fputs("Could not decode input PNG.\n", stderr)
  exit(65)
}

let width = input.width
let height = input.height
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.noneSkipLast.rawValue)

guard let context = CGContext(
  data: nil,
  width: width,
  height: height,
  bitsPerComponent: 8,
  bytesPerRow: width * 4,
  space: colorSpace,
  bitmapInfo: bitmapInfo.rawValue
) else {
  fputs("Could not create RGB bitmap context.\n", stderr)
  exit(66)
}

// Brand Indigo fills any transparent source corners. iOS applies its own icon mask;
// the submitted marketing icon itself must remain a full opaque square.
context.setFillColor(CGColor(red: 91.0 / 255.0, green: 93.0 / 255.0, blue: 238.0 / 255.0, alpha: 1.0))
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
context.interpolationQuality = .high
context.draw(input, in: CGRect(x: 0, y: 0, width: width, height: height))

guard let flattened = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
  fputs("Could not create output PNG destination.\n", stderr)
  exit(67)
}

CGImageDestinationAddImage(destination, flattened, nil)
guard CGImageDestinationFinalize(destination) else {
  fputs("Could not write output PNG.\n", stderr)
  exit(68)
}
