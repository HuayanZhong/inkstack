import Image from 'next/image'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>墨栈 Inkstack</h1>
          <p>
            AI design-to-code 画布：让 AI
            落笔，让代码落地。当前只落地了应用外壳，画布与后端服务随后接入。
          </p>
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://github.com/HuayanZhong/inkstack"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            仓库
          </a>
          <a
            className={styles.secondary}
            href="https://github.com/HuayanZhong/inkstack/blob/main/docs/architecture/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            架构文档
          </a>
        </div>
      </main>
    </div>
  )
}
