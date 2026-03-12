import Stickman from './Stickman'
import styles from './ArmDrive.module.css'

export default function ArmDrive() {
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
    />
  )
}
