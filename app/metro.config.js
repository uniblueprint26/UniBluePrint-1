const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Inline requires defers module evaluation until first use,
// significantly reducing peak memory during bundling on Windows
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
})

module.exports = config
