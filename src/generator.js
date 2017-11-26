import {
  R,
  G,
  B,
} from './consts'

const D_PER_LEVEL = 80
const D_COLOR_COUNT = [0, 2, 3, 4]
const D_STEP_BATCH = [0, 4, 3, 0, 2]

const P_SYMMETRY_NONE = 0.1
const P_SYMMETRY_H = 0.3
const P_SYMMETRY_V = 0.5
const P_SYMMETRY_ROTATE = 0.7
const P_SYMMETRY_ALL = 0.9
const P_SYMMETRY_ALL_ROTATE = 1

const P_2_COLOR_D_MIN = D_PER_LEVEL * 2
const P_3_COLOR_D_MIN = D_PER_LEVEL * 4
const P_2_COLOR_D_INC = D_PER_LEVEL / 5
const P_3_COLOR_D_INC = D_PER_LEVEL / 10

const SYMMETRY_NONE = 0
const SYMMETRY_H = 1
const SYMMETRY_V = 2
const SYMMETRY_ROTATE = 3
const SYMMETRY_ALL = 4
const SYMMETRY_ALL_ROTATE = 5

const levelToDifficulty = (level) => {
  return level * D_PER_LEVEL
}

export const endless = ({level, timeUsed}) => {
  const difficulty = levelToDifficulty(level)

  // random utils
  const seed = Math.floor(Math.random() * (1000000000))
  let curSeed = seed
  let curRandMul = 1
  const getRandom = (max) => {
    let prevRandMul = curRandMul
    curRandMul *= max
    if (curRandMul > 1000000000) {
      curSeed = curSeed * 137 % 1000000000
      prevRandMul = curRandMul = 1
    }
    return Math.floor(curSeed / prevRandMul) % max
  }

  // init map
  const colorMap = []
  for(let j = 0; j < 5; j++) {
    const line = []
    for(let i = 0; i < 5; i++) {
      line.push(0)
    }
    colorMap.push(line)
  }
  const opCountMap = []
  for(let j = 0; j < 5; j++) {
    const line = []
    for(let i = 0; i < 5; i++) {
      line.push(0)
    }
    opCountMap.push(line)
  }

  // generate symmetry type
  const symmetryRand = getRandom(10) / 10
  let symmetryType = 0
  if (symmetryRand < P_SYMMETRY_NONE) {
    symmetryType = SYMMETRY_NONE
  } else if (symmetryRand < P_SYMMETRY_H) {
    symmetryType = SYMMETRY_H
  } else if (symmetryRand < P_SYMMETRY_V) {
    symmetryType = SYMMETRY_V
  } else if (symmetryRand < P_SYMMETRY_ROTATE) {
    symmetryType = SYMMETRY_ROTATE
  } else if (symmetryRand < P_SYMMETRY_ALL) {
    symmetryType = SYMMETRY_ALL
  } else if (symmetryRand < P_SYMMETRY_ALL_ROTATE) {
    symmetryType = SYMMETRY_ALL_ROTATE
  }

  // generate color type
  const colorKey = [R, G, B][getRandom(3)]
  const colorRand = getRandom(10) / 10
  let colors = [R, G, B]
  let colorType = 1
  const pColor2 = (difficulty - P_2_COLOR_D_MIN) * P_2_COLOR_D_INC
  const pColor3 = (difficulty - P_3_COLOR_D_MIN) * P_3_COLOR_D_INC
  if (colorRand < pColor3) {
    colors = [R, G, B]
    colorType = 3
  } else if (colorRand < pColor2) {
    colors.splice(colors.indexOf(colorKey), 1)
    colorType = 2
  } else {
    colors = [colorKey]
    colorType = 1
  }

  // generate each step
  let currentD = 0
  // eslint-disable-next-line complexity
  const nextStep = () => {
    const stepColor = colors[getRandom(colorType)]
    const stepM = getRandom(5)
    const stepN = getRandom(5)

    // init maps
    const signMap = []
    for(let j = 0; j < 5; j++) {
      const line = []
      for(let i = 0; i < 5; i++) {
        line.push(0)
      }
      signMap.push(line)
    }
    const weightMap = []
    for(let j = 0; j < 5; j++) {
      const line = []
      for(let i = 0; i < 5; i++) {
        line.push(0)
      }
      weightMap.push(line)
    }

    // construct sign map
    let stepCount = 0
    const setSignMap = (m, n) => {
      if (signMap[n][m]) return
      stepCount++
      signMap[n][m] = 1
    }
    setSignMap(stepM, stepN)
    if (symmetryType === SYMMETRY_H) {
      setSignMap(4 - stepM, stepN)
    } else if (symmetryType === SYMMETRY_V) {
      setSignMap(stepM, 4 - stepN)
    } else if (symmetryType === SYMMETRY_ROTATE) {
      setSignMap(4 - stepM, 4 - stepN)
    } else if (symmetryType === SYMMETRY_ALL) {
      setSignMap(4 - stepM, stepN)
      setSignMap(stepM, 4 - stepN)
      setSignMap(4 - stepM, 4 - stepN)
    } else if (symmetryType === SYMMETRY_ALL_ROTATE) {
      setSignMap(4 - stepN, stepM)
      setSignMap(stepN, 4 - stepM)
      setSignMap(4 - stepM, 4 - stepN)
    }

    // extend weight map
    let stepD = 0
    for(let j = 0; j < 5; j++) {
      for(let i = 0; i < 5; i++) {
        if (signMap[j - 1] && signMap[j - 1][i]) stepD += (++weightMap[j][i]) + opCountMap[j][i]
        if (signMap[j + 1] && signMap[j + 1][i]) stepD += (++weightMap[j][i]) + opCountMap[j][i]
        if (signMap[j][i - 1]) stepD += (++weightMap[j][i]) + opCountMap[j][i]
        if (signMap[j][i + 1]) stepD += (++weightMap[j][i]) + opCountMap[j][i]
        if (signMap[j][i]) stepD += (++weightMap[j][i]) + opCountMap[j][i]
      }
    }

    // check and write to map
    stepD *= D_COLOR_COUNT[colorType] * D_STEP_BATCH[stepCount]
    if (stepD + currentD <= difficulty || currentD === 0) {
      console.info([stepM, stepN, stepColor]) // FIXME step is shown in console
      for(let j = 0; j < 5; j++) {
        for(let i = 0; i < 5; i++) {
          if (weightMap[j][i] % 2) {
            colorMap[j][i] ^= stepColor
          }
          opCountMap[j][i] += weightMap[j][i]
        }
      }
    } else {
      stepD = 0
    }
    return stepD
  }
  while (currentD < difficulty) {
    const stepD = nextStep()
    if (!stepD) break
    currentD += stepD
  }

  const levelObj = {
    timeUsed,
    title: '#' + (level < 10 ? '0' + level : level),
    seed,
    difficulty: currentD,
    map: colorMap
  }
  return levelObj
}
