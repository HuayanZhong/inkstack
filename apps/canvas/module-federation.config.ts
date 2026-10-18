export const mfConfig = {
  name: 'canvas',
  filename: 'remoteEntry.js',
  exposes: {
    './Canvas': './src/Canvas.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
}
