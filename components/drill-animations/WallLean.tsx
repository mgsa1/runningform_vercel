import Stickman from './Stickman'
import styles from './WallLean.module.css'

export default function WallLean() {
  // bodyLean=15 to show the forward lean against the wall
  return (
    <Stickman
      leftThighClass={styles.leftThigh}
      rightThighClass={styles.rightThigh}
      leftShinClass={styles.leftShin}
      rightShinClass={styles.rightShin}
      leftUpperArmClass={styles.leftUpperArm}
      rightUpperArmClass={styles.rightUpperArm}
      leftForearmClass={styles.leftForearm}
      rightForearmClass={styles.rightForearm}
      bodyLean={15}
    />
  )
}
