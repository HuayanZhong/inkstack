import { CanvasHost } from './canvas-host'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>墨栈 Inkstack</h1>
        <p>AI design-to-code 画布</p>
      </header>
      <section className={styles.canvas} aria-label="画布">
        <CanvasHost />
      </section>
    </main>
  )
}
