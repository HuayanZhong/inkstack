import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { beforeAll, afterEach, vi } from 'vitest'

// jsdom 不实现 canvas；组件在无 WebGL 时降级为纯内容，这里统一返回 null 以消除噪声。
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(cleanup)
