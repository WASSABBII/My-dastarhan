import styles from './ReviewsTab.module.css'

export default function ReviewsTab() {
  return (
    <div className={styles.placeholder}>
      <div className={styles.icon}>⭐</div>
      <h3 className={styles.title}>Отзывы появятся после вашего визита</h3>
      <p className={styles.text}>После бронирования и посещения ресторана вы получите приглашение оставить отзыв.</p>
    </div>
  )
}
