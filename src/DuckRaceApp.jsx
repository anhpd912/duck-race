import React, { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import {
  Terminal,
  Trophy,
  Play,
  RefreshCw,
  User as UserIcon,
  ChevronRight,
  Award,
  Medal,
  Trash2,
  Zap,
  Snowflake,
  Gift,
} from "lucide-react";

// --- POWER-UPS ---
const POWER_UPS = {
  FREEZE: {
    id: "freeze",
    name: "Đóng Băng",
    icon: "❄️",
    desc: "Làm đơ 1 người 3 giây",
  },
  BOOST: {
    id: "boost",
    name: "Tăng Tốc",
    icon: "⚡",
    desc: "Tốc độ x2 trong 5 giây",
  },
  BONUS: {
    id: "bonus",
    name: "Bonus",
    icon: "🎁",
    desc: "+10 điểm ngay lập tức",
  },
};
const STREAK_FOR_POWERUP = 3; // Đúng 3 câu liên tiếp = nhận power-up

// --- CÂU HỎI VỀ TƯ TƯỞNG HỒ CHÍ MINH ---
const QUESTIONS = [
  {
    q: "Theo Hồ Chí Minh, đại đoàn kết dân tộc là gì?",
    options: [
      "Chỉ đoàn kết trong Đảng",
      "Đoàn kết toàn dân tộc, không phân biệt giai cấp, tôn giáo, dân tộc",
      "Đoàn kết giữa các nước xã hội chủ nghĩa",
      "Đoàn kết trong quân đội",
    ],
    answer: 1,
  },
  {
    q: "Câu nói nổi tiếng nào của Bác Hồ thể hiện tư tưởng đại đoàn kết?",
    options: [
      "Không có gì quý hơn độc lập tự do",
      "Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công",
      "Dễ trăm lần không dân cũng chịu",
      "Vì lợi ích mười năm trồng cây",
    ],
    answer: 1,
  },
  {
    q: "Theo Hồ Chí Minh, lực lượng nào là nền tảng của khối đại đoàn kết dân tộc?",
    options: [
      "Trí thức và tư sản",
      "Công nhân và nông dân",
      "Quân đội và công an",
      "Thanh niên và học sinh",
    ],
    answer: 1,
  },
  {
    q: "Mặt trận Việt Minh được thành lập năm nào, thể hiện tư tưởng đại đoàn kết của Bác?",
    options: ["1930", "1941", "1945", "1954"],
    answer: 1,
  },
  {
    q: "Theo Hồ Chí Minh, mục tiêu của đại đoàn kết dân tộc là gì?",
    options: [
      "Xây dựng chủ nghĩa xã hội",
      "Độc lập dân tộc và hạnh phúc cho nhân dân",
      "Đánh đuổi thực dân",
      "Phát triển kinh tế",
    ],
    answer: 1,
  },
  {
    q: "Bác Hồ cho rằng đại đoàn kết dân tộc phải dựa trên nguyên tắc nào?",
    options: [
      "Lợi ích cá nhân",
      "Lợi ích chung của dân tộc, tôn trọng lợi ích chính đáng của các bộ phận",
      "Mệnh lệnh từ trên xuống",
      "Sức mạnh quân sự",
    ],
    answer: 1,
  },
  {
    q: "Theo tư tưởng Hồ Chí Minh, Mặt trận dân tộc thống nhất có vai trò gì?",
    options: [
      "Thay thế Đảng lãnh đạo",
      "Tập hợp, đoàn kết mọi lực lượng yêu nước",
      "Chỉ hoạt động trong thời chiến",
      "Quản lý kinh tế đất nước",
    ],
    answer: 1,
  },
  {
    q: "Hồ Chí Minh nhấn mạnh phải đoàn kết với đối tượng nào?",
    options: [
      "Chỉ những người cùng chính kiến",
      "Tất cả những ai có lòng yêu nước, kể cả người từng lầm đường lạc lối",
      "Chỉ công nhân và nông dân",
      "Chỉ người trong Đảng",
    ],
    answer: 1,
  },
  {
    q: "Theo Bác Hồ, muốn đoàn kết tốt cần phải làm gì?",
    options: [
      "Tự phê bình và phê bình, thật thà, chân thành",
      "Áp đặt quan điểm của mình",
      "Tránh mọi xung đột",
      "Chỉ nói những điều hay",
    ],
    answer: 0,
  },
  {
    q: "Di chúc của Chủ tịch Hồ Chí Minh nhắn nhủ điều gì về đoàn kết?",
    options: [
      "Đoàn kết quốc tế là quan trọng nhất",
      "Đoàn kết trong Đảng là hạt nhân, phải giữ gìn sự đoàn kết như giữ gìn con ngươi của mắt mình",
      "Đoàn kết chỉ cần trong thời chiến",
      "Đoàn kết không cần thiết nếu có sức mạnh",
    ],
    answer: 1,
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const FINISH_LINE = 100; // % để về đích
const STEP_PER_CLICK = 2; // Mỗi click/space tiến bao nhiêu %
const POINTS_CORRECT = 10;
const POINTS_TIMEOUT = -5; // Trừ điểm khi hết giờ
const ANSWER_TIME_LIMIT = 7; // Giây
const SNIPER_THRESHOLD = 80; // % để có thể bị bắn tỉa
const SNIPER_PENALTY = 30; // Bị bắn lùi bao nhiêu %
const STEAL_TIME_THRESHOLD = 4; // Sau 4 giây có thể cướp đáp án
const STEAL_WRONG_PENALTY = -15; // Cướp mà sai thì -15 điểm

// Vòng quay may rủi
const ROULETTE_OPTIONS = [
  { id: "double", name: "x2 ĐIỂM!", icon: "🎁", effect: "double" },
  { id: "lose", name: "MẤT ĐIỂM!", icon: "💀", effect: "lose" },
  { id: "swap", name: "ĐỔI ĐIỂM!", icon: "🔄", effect: "swap" },
  { id: "nothing", name: "AN TOÀN~", icon: "😇", effect: "nothing" },
  { id: "bonus", name: "+5 BONUS!", icon: "⭐", effect: "bonus" },
  { id: "steal", name: "CƯỚP 10đ!", icon: "🏴‍☠️", effect: "steal" },
];

const AVATARS = [
  "🦆",
  "🐥",
  "🐤",
  "🐣",
  "🐔",
  "🐧",
  "🐦",
  "🦅",
  "🦉",
  "🦜",
  "🐸",
  "🐢",
];

const CONFETTI_POSITIONS = Array.from({ length: 30 }, (_, i) => ({
  left: (i * 17 + 23) % 100,
  top: (i * 31 + 11) % 100,
  delay: (i * 0.1) % 2,
}));

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyCND_itQamnCCYpDW54YcI6xM_v3U9z0yU",
  authDomain: "duckrace-f47ee.firebaseapp.com",
  projectId: "duckrace-f47ee",
  storageBucket: "duckrace-f47ee.firebasestorage.app",
  messagingSenderId: "1046455337276",
  appId: "1:1046455337276:web:9804fb375306c5786b5e39",
  measurementId: "G-902HH30CWF",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "hcm-quiz-race";

// Helper: Lấy hoặc tạo player ID cố định (lưu localStorage)
const getOrCreatePlayerId = () => {
  let playerId = localStorage.getItem("hcm_quiz_player_id");
  if (!playerId) {
    playerId =
      "player_" +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
    localStorage.setItem("hcm_quiz_player_id", playerId);
  }
  return playerId;
};

// --- MAIN COMPONENT ---
export default function DuckRaceApp() {
  const [user, setUser] = useState(null);
  const [playerId] = useState(getOrCreatePlayerId); // ID cố định từ localStorage
  const [playerName, setPlayerName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({
    status: "waiting", // waiting, racing, answering, showing_answer, finished
    currentQuestionIndex: 0,
    winnerId: null, // ID người về đích đầu tiên
    winnerAnswer: null, // Đáp án người thắng chọn
  });

  // Power-up states
  const [myPowerUps, setMyPowerUps] = useState([]); // Power-ups của player
  const [activePowerUp, setActivePowerUp] = useState(null); // Power-up đang active
  const [showPowerUpGained, setShowPowerUpGained] = useState(null); // Hiện thông báo nhận power-up
  const [showPowerUpSelection, setShowPowerUpSelection] = useState(false); // Hiện UI chọn power-up
  const [showFreezeSelection, setShowFreezeSelection] = useState(false); // Hiện UI chọn người freeze
  const [answerTimer, setAnswerTimer] = useState(7); // Bộ đếm giờ trả lời (7 giây)
  const [showRules, setShowRules] = useState(false); // Hiện bảng nội quy

  // === NEW FEATURES ===
  const [sniperTarget, setSniperTarget] = useState(null); // Người đang ở 80%+ có thể bị bắn
  const [canStealAnswer, setCanStealAnswer] = useState(false); // Có thể cướp đáp án không
  const [showRoulette, setShowRoulette] = useState(false); // Hiện vòng quay
  const [rouletteResult, setRouletteResult] = useState(null); // Kết quả vòng quay
  const [isSpinning, setIsSpinning] = useState(false); // Đang quay
  const [lastAnswerPoints, setLastAnswerPoints] = useState(0); // Điểm vừa được từ câu trả lời
  const [sniperCooldown, setSniperCooldown] = useState(false); // Đã bắn chưa trong round này

  const lastPressTime = useRef(0);
  const isKeyReleased = useRef(true); // Phải thả phím ra mới được bấm tiếp
  const clickTimestamps = useRef([]); // Track click timestamps for macro detection
  const [macroWarning, setMacroWarning] = useState(false); // Hiện cảnh báo macro
  const isAdmin =
    new URLSearchParams(window.location.search).get("admin") === "true";

  // --- AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error.code, error.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- AUTO LEAVE WHEN CLOSING TAB ---
  useEffect(() => {
    if (!playerId || !hasJoined) return;

    const handleBeforeUnload = () => {
      // Xóa player khỏi Firestore ngay khi đóng tab/thoát trang
      const playerRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "players",
        playerId
      );
      deleteDoc(playerRef).catch(() => {});

      // Xóa localStorage để tạo player mới khi vào lại
      localStorage.removeItem("hcm_quiz_player_id");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [playerId, hasJoined]);

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!user || !playerId) return;

    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );

    const unsubGame = onSnapshot(gameStateRef, (snap) => {
      if (snap.exists()) {
        setGameState(snap.data());
      } else {
        setDoc(gameStateRef, {
          status: "waiting",
          currentQuestionIndex: 0,
          winnerId: null,
          winnerAnswer: null,
        });
      }
    });

    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      const pList = [];
      snap.forEach((d) => {
        const data = d.data();
        pList.push({
          id: d.id,
          name: data.name || "Unknown",
          avatar: data.avatar || "🦆",
          score: data.score || 0,
          position: data.position || 0,
          joinedAt: data.joinedAt || Date.now(),
          streak: data.streak || 0, // Chuỗi trả lời đúng liên tiếp
          powerUps: data.powerUps || [], // Vật phẩm đang có
          frozen: data.frozen || false, // Đang bị đóng băng
          frozenUntil: data.frozenUntil || 0,
          boosted: data.boosted || false, // Đang được tăng tốc
          boostedUntil: data.boostedUntil || 0,
        });
      });
      pList.sort((a, b) => b.score - a.score);
      setPlayers(pList);

      const me = pList.find((p) => p.id === playerId);
      if (me) {
        setHasJoined(true);
        setPlayerName(me.name);
        setMyPowerUps(me.powerUps || []);
      } else {
        // Player bị xóa khỏi game (admin xóa hết) -> reset về màn hình nhập tên
        setHasJoined(false);
        setPlayerName("");
      }
    });

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [user, playerId]);

  // --- KEYBOARD LISTENER FOR RACING ---
  const handleRaceInput = useCallback(async () => {
    if (!playerId || gameState.status !== "racing") return;

    // Phải thả phím/nút ra mới được bấm tiếp (chống giữ nút)
    if (!isKeyReleased.current) return;
    isKeyReleased.current = false;

    // Cooldown 100ms để chống lag
    const now = Date.now();
    if (now - lastPressTime.current < 100) {
      isKeyReleased.current = true;
      return;
    }

    // === MACRO DETECTION ===
    // Track click timestamps (keep last 10)
    clickTimestamps.current.push(now);
    if (clickTimestamps.current.length > 10) {
      clickTimestamps.current.shift();
    }

    // Check if 10 clicks happened in less than 800ms (too fast = macro)
    if (clickTimestamps.current.length >= 10) {
      const timeDiff = now - clickTimestamps.current[0];
      if (timeDiff < 800) {
        // DETECTED MACRO!
        setMacroWarning(true);
        setTimeout(() => setMacroWarning(false), 3000);
        clickTimestamps.current = []; // Reset
        isKeyReleased.current = true;
        return; // Block this click
      }
    }

    lastPressTime.current = now;

    const myPlayer = players.find((p) => p.id === playerId);
    if (!myPlayer) return;

    // Kiểm tra bị đóng băng
    if (myPlayer.frozen && myPlayer.frozenUntil > now) {
      isKeyReleased.current = true;
      return; // Không được di chuyển khi bị đóng băng
    }

    // Tính step (x2 nếu đang boost)
    const isBoosted = myPlayer.boosted && myPlayer.boostedUntil > now;
    const step = isBoosted ? STEP_PER_CLICK * 2 : STEP_PER_CLICK;

    const newPosition = Math.min(myPlayer.position + step, FINISH_LINE);

    // Cập nhật vị trí
    const playerRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    await updateDoc(playerRef, { position: newPosition });

    // === SNIPER: Kiểm tra nếu vượt 80% thì có thể bị bắn ===
    if (
      newPosition >= SNIPER_THRESHOLD &&
      myPlayer.position < SNIPER_THRESHOLD
    ) {
      // Vừa vượt qua ngưỡng 80%
      setSniperTarget(playerId);
    }

    // Kiểm tra về đích
    if (newPosition >= FINISH_LINE && !gameState.winnerId) {
      const gameStateRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "game_config",
        "gameState"
      );
      await updateDoc(gameStateRef, {
        status: "answering",
        winnerId: playerId,
      });
    }
  }, [playerId, gameState.status, gameState.winnerId, players]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (e.repeat) return; // Chống giữ phím
        handleRaceInput();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space" || e.key === " ") {
        isKeyReleased.current = true;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleRaceInput]);

  // Hàm xử lý khi hết giờ trả lời
  const handleTimeout = useCallback(async () => {
    if (gameState.winnerId !== playerId) return; // Chỉ người thắng cuộc mới bị trừ điểm

    const playerRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    const myPlayer = players.find((p) => p.id === playerId);

    // Trừ 5 điểm và reset streak
    await updateDoc(playerRef, {
      score: Math.max(0, (myPlayer?.score || 0) + POINTS_TIMEOUT), // Không cho âm
      streak: 0,
    });

    // Chuyển sang hiển thị đáp án (answer = null để hiện là timeout)
    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );
    await updateDoc(gameStateRef, {
      status: "showing_answer",
      winnerAnswer: -1, // -1 = timeout/không trả lời
    });
  }, [gameState.winnerId, playerId, players]);

  // --- ANSWER TIMER (7 giây) ---
  useEffect(() => {
    if (gameState.status === "answering") {
      // Reset timer khi bắt đầu trả lời
      setAnswerTimer(ANSWER_TIME_LIMIT);
      setCanStealAnswer(false); // Reset steal

      const interval = setInterval(() => {
        setAnswerTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Hết giờ! Xử lý timeout
            handleTimeout();
            return 0;
          }
          // Sau 4 giây thì cho phép cướp đáp án
          if (prev <= ANSWER_TIME_LIMIT - STEAL_TIME_THRESHOLD) {
            setCanStealAnswer(true);
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState.status, gameState.winnerId, handleTimeout]);

  // === SNIPER: Detect ai đang ở 80%+ ===
  useEffect(() => {
    if (gameState.status === "racing") {
      const target = players.find(
        (p) =>
          p.position >= SNIPER_THRESHOLD &&
          p.position < FINISH_LINE &&
          p.id !== playerId
      );
      setSniperTarget(target || null);
    } else {
      setSniperTarget(null);
      setSniperCooldown(false);
    }
  }, [players, gameState.status, playerId]);

  // === SNIPER: Bắn tỉa người đang dẫn đầu ===
  const handleSnipe = async (targetId) => {
    if (sniperCooldown || !targetId) return;

    const targetPlayer = players.find((p) => p.id === targetId);
    if (!targetPlayer || targetPlayer.position < SNIPER_THRESHOLD) return;

    setSniperCooldown(true); // Chỉ được bắn 1 lần mỗi round

    const targetRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      targetId
    );

    // Lùi target về max(0, position - SNIPER_PENALTY)
    const newPosition = Math.max(0, targetPlayer.position - SNIPER_PENALTY);
    await updateDoc(targetRef, { position: newPosition });

    // Hiện thông báo
    setActivePowerUp({ type: "SNIPER", targetName: targetPlayer.name });
    setTimeout(() => setActivePowerUp(null), 2000);
  };

  // === CƯỚP ĐÁP ÁN ===
  const handleStealAnswer = async () => {
    if (!canStealAnswer || gameState.winnerId === playerId) return;

    // Chuyển quyền trả lời sang người cướp
    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );
    await updateDoc(gameStateRef, {
      winnerId: playerId,
      answerStolen: true, // Đánh dấu là bị cướp
    });
    setCanStealAnswer(false);
  };

  // === VÒNG QUAY MAY RỦI ===
  const spinRoulette = async (pointsEarned) => {
    setShowRoulette(true);
    setIsSpinning(true);
    setLastAnswerPoints(pointsEarned);

    // Random kết quả sau 2 giây
    setTimeout(async () => {
      const result =
        ROULETTE_OPTIONS[Math.floor(Math.random() * ROULETTE_OPTIONS.length)];
      setRouletteResult(result);
      setIsSpinning(false);

      // Áp dụng effect
      const myPlayer = players.find((p) => p.id === playerId);
      const playerRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "players",
        playerId
      );

      let finalScore = myPlayer?.score || 0;

      switch (result.effect) {
        case "double":
          finalScore += pointsEarned; // Đã được +10, giờ +10 nữa = x2
          break;
        case "lose":
          finalScore -= pointsEarned; // Mất điểm vừa được
          break;
        case "swap": {
          // Đổi điểm với người random khác
          const others = players.filter((p) => p.id !== playerId);
          if (others.length > 0) {
            const randomOther =
              others[Math.floor(Math.random() * others.length)];
            const otherRef = doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "players",
              randomOther.id
            );
            await updateDoc(otherRef, { score: finalScore });
            finalScore = randomOther.score;
          }
          break;
        }
        case "bonus":
          finalScore += 5;
          break;
        case "steal": {
          // Cướp 10 điểm từ người dẫn đầu
          const leader = players
            .filter((p) => p.id !== playerId)
            .sort((a, b) => b.score - a.score)[0];
          if (leader && leader.score >= 10) {
            const leaderRef = doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "players",
              leader.id
            );
            await updateDoc(leaderRef, { score: leader.score - 10 });
            finalScore += 10;
          }
          break;
        }
        case "nothing":
        default:
          // Không có gì
          break;
      }

      await updateDoc(playerRef, { score: Math.max(0, finalScore) });

      // Ẩn roulette sau 2 giây
      setTimeout(() => {
        setShowRoulette(false);
        setRouletteResult(null);
      }, 2500);
    }, 2000);
  };

  // --- ACTIONS ---
  const joinGame = async () => {
    if (!playerId || !playerName.trim()) return;
    const playerRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

    await setDoc(playerRef, {
      name: playerName.trim().substring(0, 15),
      avatar: randomAvatar,
      score: 0,
      position: 0,
      joinedAt: Date.now(),
    });
    setHasJoined(true);
  };

  const startRace = async () => {
    // Reset vị trí tất cả người chơi
    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const snap = await getDocs(playersRef);
    snap.forEach((d) => {
      updateDoc(d.ref, { position: 0 });
    });

    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );
    await updateDoc(gameStateRef, {
      status: "racing",
      winnerId: null,
      winnerAnswer: null,
    });
  };

  const handleAnswer = async (optionIndex) => {
    if (gameState.winnerId !== playerId) return;

    const currentQ = QUESTIONS[gameState.currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.answer;

    const playerRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    const myPlayer = players.find((p) => p.id === playerId);
    const currentStreak = myPlayer?.streak || 0;
    const wasStolen = gameState.answerStolen; // Kiểm tra có phải cướp đáp án không

    let pointsEarned = 0;

    if (isCorrect) {
      const newStreak = currentStreak + 1;

      // Nhận power-up khi đạt 3 câu liên tiếp - cho player CHỌN
      if (
        newStreak >= STREAK_FOR_POWERUP &&
        newStreak % STREAK_FOR_POWERUP === 0
      ) {
        setShowPowerUpSelection(true); // Hiện UI chọn power-up
      }

      pointsEarned = wasStolen ? 15 : POINTS_CORRECT; // Cướp đúng = +15

      await updateDoc(playerRef, {
        score: (myPlayer?.score || 0) + pointsEarned,
        streak: newStreak,
      });

      // === VÒNG QUAY MAY RỦI sau khi trả lời đúng ===
      spinRoulette(pointsEarned);
    } else {
      // Trả lời sai -> reset streak
      // Nếu cướp mà sai thì -15 điểm
      if (wasStolen) {
        await updateDoc(playerRef, {
          score: Math.max(0, (myPlayer?.score || 0) + STEAL_WRONG_PENALTY),
          streak: 0,
        });
      } else {
        await updateDoc(playerRef, {
          streak: 0,
        });
      }
    }

    // Chuyển sang hiển thị đáp án
    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );
    await updateDoc(gameStateRef, {
      status: "showing_answer",
      winnerAnswer: optionIndex,
      answerStolen: false, // Reset flag
    });
  };

  const nextQuestion = async () => {
    const nextIndex = gameState.currentQuestionIndex + 1;
    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );

    if (nextIndex >= TOTAL_QUESTIONS) {
      await updateDoc(gameStateRef, { status: "finished" });
    } else {
      // Reset vị trí cho vòng mới
      const playersRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "players"
      );
      const snap = await getDocs(playersRef);
      snap.forEach((d) => {
        updateDoc(d.ref, { position: 0 });
      });

      await updateDoc(gameStateRef, {
        status: "racing",
        currentQuestionIndex: nextIndex,
        winnerId: null,
        winnerAnswer: null,
      });
    }
  };

  const resetGame = async () => {
    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );
    await updateDoc(gameStateRef, {
      status: "waiting",
      currentQuestionIndex: 0,
      winnerId: null,
      winnerAnswer: null,
    });

    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const snap = await getDocs(playersRef);
    snap.forEach((d) => {
      updateDoc(d.ref, {
        score: 0,
        position: 0,
        streak: 0,
        powerUps: [],
        frozen: false,
        frozenUntil: 0,
        boosted: false,
        boostedUntil: 0,
      });
    });
  };

  const removeAllPlayers = async () => {
    if (!window.confirm("Xóa hết người chơi?")) return;

    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const snap = await getDocs(playersRef);
    const deletePromises = [];
    snap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
    await Promise.all(deletePromises);

    // Reset game state
    const gameStateRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "game_config",
      "gameState"
    );
    await updateDoc(gameStateRef, {
      status: "waiting",
      currentQuestionIndex: 0,
      winnerId: null,
      winnerAnswer: null,
    });
  };

  // --- POWER-UP FUNCTIONS ---

  // Hàm chọn power-up khi đạt streak
  const selectPowerUp = async (powerUpType) => {
    if (!playerId) return;

    const playerRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    const myPlayer = players.find((p) => p.id === playerId);
    const newPowerUps = [...(myPlayer?.powerUps || []), powerUpType];

    await updateDoc(playerRef, { powerUps: newPowerUps });
    setShowPowerUpSelection(false);
    setShowPowerUpGained(POWER_UPS[powerUpType]);
    setTimeout(() => setShowPowerUpGained(null), 2000);
  };

  const activatePowerUp = async (powerUpType, targetPlayerId = null) => {
    if (!playerId) return;

    // Nếu là FREEZE và chưa chọn người -> hiện UI chọn
    if (powerUpType === "FREEZE" && !targetPlayerId) {
      setShowFreezeSelection(true);
      return;
    }

    const myPlayer = players.find((p) => p.id === playerId);
    if (!myPlayer || !myPlayer.powerUps?.includes(powerUpType)) return;

    // Xóa power-up đã dùng
    const newPowerUps = [...myPlayer.powerUps];
    const idx = newPowerUps.indexOf(powerUpType);
    if (idx > -1) newPowerUps.splice(idx, 1);

    const myPlayerRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    await updateDoc(myPlayerRef, { powerUps: newPowerUps });

    const now = Date.now();

    if (powerUpType === "FREEZE" && targetPlayerId) {
      // Đóng băng người khác 3 giây
      setShowFreezeSelection(false);
      const targetRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "players",
        targetPlayerId
      );
      const targetPlayer = players.find((p) => p.id === targetPlayerId);
      await updateDoc(targetRef, {
        frozen: true,
        frozenUntil: now + 3000,
      });
      setActivePowerUp({ type: "FREEZE", targetName: targetPlayer?.name });
      setTimeout(() => {
        updateDoc(targetRef, { frozen: false, frozenUntil: 0 });
        setActivePowerUp(null);
      }, 3000);
    } else if (powerUpType === "BOOST") {
      // Tăng tốc x2 trong 5 giây
      await updateDoc(myPlayerRef, {
        boosted: true,
        boostedUntil: now + 5000,
      });
      setActivePowerUp({ type: "BOOST" });
      setTimeout(() => {
        updateDoc(myPlayerRef, { boosted: false, boostedUntil: 0 });
        setActivePowerUp(null);
      }, 5000);
    } else if (powerUpType === "BONUS") {
      // +10 điểm ngay lập tức - FIX: cộng vào score hiện tại
      const currentScore = myPlayer.score || 0;
      await updateDoc(myPlayerRef, {
        score: currentScore + 10,
      });
      setActivePowerUp({ type: "BONUS" });
      setTimeout(() => setActivePowerUp(null), 1500);
    }
  };

  // --- RENDER HELPERS ---
  const myPlayer = players.find((p) => p.id === playerId);
  const currentQuestion = QUESTIONS[gameState.currentQuestionIndex];
  const winner = players.find((p) => p.id === gameState.winnerId);
  const top3Players = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const sortedByPosition = [...players].sort((a, b) => b.position - a.position);

  const statusText =
    {
      waiting: "CHỜ BẮT ĐẦU",
      racing: `🏁 ĐUA ĐI! - Câu ${
        gameState.currentQuestionIndex + 1
      }/${TOTAL_QUESTIONS}`,
      answering: "⏳ ĐANG TRẢ LỜI...",
      showing_answer: "📝 XEM ĐÁP ÁN",
      finished: "🏆 KẾT THÚC",
    }[gameState.status] || "";

  return (
    <div className="app-container">
      {/* Power-up gained notification */}
      {showPowerUpGained && (
        <div className="powerup-gained">
          <h3>🎉 NHẬN VẬT PHẨM!</h3>
          <div className="icon">{showPowerUpGained.icon}</div>
          <div className="name">{showPowerUpGained.name}</div>
          <div className="desc">{showPowerUpGained.desc}</div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <Terminal className="icon icon-pulse" />
          <h1 className="header-title">TƯ TƯỞNG HỒ CHÍ MINH</h1>
        </div>
        <div className="header-center">
          <div className="header-status">{statusText}</div>
        </div>
        <div className="header-right">
          {/* Streak indicator */}
          {!isAdmin && myPlayer?.streak > 0 && (
            <div className="streak-indicator">🔥 Streak: {myPlayer.streak}</div>
          )}
          {/* Nút xem nội quy */}
          {!isAdmin && hasJoined && gameState.status === "waiting" && (
            <button
              className="btn btn-rules"
              onClick={() => setShowRules(true)}
            >
              📋 NỘI QUY
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* LOGIN - Người chơi */}
        {!isAdmin && !hasJoined && (
          <div className="login-container">
            <div className="login-box">
              <div className="login-avatar">
                <span>🦆</span>
              </div>
              <h2 className="login-title">ĐUA VỊT TRẢ LỜI CÂU HỎI</h2>
              <p className="login-subtitle">
                Spam SPACE/CLICK để đua - Ai về đích trước được trả lời!
              </p>
              <input
                type="text"
                maxLength={15}
                className="login-input"
                placeholder="NHẬP TÊN CỦA BẠN..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinGame()}
              />
              <button
                onClick={joinGame}
                disabled={!playerName.trim()}
                className="btn btn-primary"
              >
                <UserIcon className="icon-sm" /> THAM GIA
              </button>
            </div>
          </div>
        )}

        {/* ADMIN VIEW */}
        {isAdmin && gameState.status !== "finished" && (
          <div className="game-container">
            <div className="control-panel">
              <div className="control-left">
                <span className="admin-badge">👑 ADMIN</span>
              </div>
              <div className="control-right">
                {gameState.status === "waiting" && players.length > 0 && (
                  <button onClick={startRace} className="btn btn-start">
                    <Play className="icon-xs" /> BẮT ĐẦU ĐUA
                  </button>
                )}
                {gameState.status === "showing_answer" && (
                  <button onClick={nextQuestion} className="btn btn-next">
                    <ChevronRight className="icon-xs" />
                    {gameState.currentQuestionIndex + 1 >= TOTAL_QUESTIONS
                      ? "KẾT THÚC"
                      : "CÂU TIẾP"}
                  </button>
                )}
                <button onClick={resetGame} className="btn btn-reset">
                  <RefreshCw className="icon-xs" /> RESET
                </button>
                <button onClick={removeAllPlayers} className="btn btn-danger">
                  <Trash2 className="icon-xs" /> XÓA HẾT
                </button>
                <div className="player-count">{players.length} người chơi</div>
              </div>
            </div>

            {/* Admin - Waiting */}
            {gameState.status === "waiting" && (
              <div className="waiting-container">
                <div className="waiting-icon">🎮</div>
                <h2 className="waiting-title">VÀO MÀ CHIẾN ĐI ANH EM 🦆</h2>
                <p className="waiting-text">
                  {players.length === 0
                    ? "Đang chờ người chơi..."
                    : "Nhấn BẮT ĐẦU ĐUA khi sẵn sàng!"}
                </p>
                <div className="players-list">
                  <h3>Người chơi ({players.length}):</h3>
                  <div className="players-grid">
                    {players.map((p) => (
                      <div key={p.id} className="player-chip">
                        <span>{p.avatar}</span> {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Admin - Racing View */}
            {gameState.status === "racing" && (
              <div className="race-view">
                <h2 className="race-title">
                  🏁 ĐANG ĐUA - Câu {gameState.currentQuestionIndex + 1}
                </h2>
                <div className="race-track-container">
                  <div className="finish-line">
                    <span>ĐÍCH</span>
                  </div>
                  {sortedByPosition.map((p) => (
                    <div key={p.id} className="player-lane">
                      <div className="lane-info">
                        <span>
                          {p.avatar} {p.name}
                        </span>
                        <span>{Math.round(p.position)}%</span>
                      </div>
                      <div className="lane-track">
                        <div
                          className="progress-bar"
                          style={{ width: `${p.position}%` }}
                        />
                        <div
                          className="duck"
                          style={{ left: `${p.position}%` }}
                        >
                          {p.avatar}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin - Answering/Showing Answer */}
            {(gameState.status === "answering" ||
              gameState.status === "showing_answer") &&
              currentQuestion && (
                <div className="question-view">
                  <div className="winner-banner">
                    🏆 <strong>{winner?.name}</strong> về đích trước!
                    {gameState.status === "answering" && " Đang trả lời..."}
                  </div>
                  <div className="question-box">
                    {/* Timer thanh ngang cho Admin */}
                    {gameState.status === "answering" && (
                      <div className="timer-bar-container">
                        <div
                          className={`timer-bar ${
                            answerTimer <= 3 ? "timer-bar-urgent" : ""
                          }`}
                          style={{
                            width: `${
                              (answerTimer / ANSWER_TIME_LIMIT) * 100
                            }%`,
                          }}
                        />
                        <span className="timer-bar-text">{answerTimer}s</span>
                      </div>
                    )}
                    <p className="question-number">
                      Câu {gameState.currentQuestionIndex + 1}/{TOTAL_QUESTIONS}
                    </p>
                    <p className="question-text">{currentQuestion.q}</p>
                    <div className="options-grid">
                      {currentQuestion.options.map((opt, idx) => {
                        let cls = "option-btn";
                        if (gameState.status === "showing_answer") {
                          if (idx === currentQuestion.answer)
                            cls += " option-correct";
                          else if (idx === gameState.winnerAnswer)
                            cls += " option-wrong";
                        }
                        return (
                          <button key={idx} className={cls} disabled>
                            <span className="option-letter">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {gameState.status === "showing_answer" && (
                      <div
                        className={`answer-feedback ${
                          gameState.winnerAnswer === currentQuestion.answer
                            ? "correct"
                            : gameState.winnerAnswer === -1
                            ? "timeout"
                            : "wrong"
                        }`}
                      >
                        {gameState.winnerAnswer === currentQuestion.answer
                          ? `✅ ${winner?.name} trả lời ĐÚNG! +${POINTS_CORRECT} điểm`
                          : gameState.winnerAnswer === -1
                          ? `⏰ ${winner?.name} HẾT GIờ! ${POINTS_TIMEOUT} điểm`
                          : `❌ ${winner?.name} trả lời SAI!`}
                      </div>
                    )}
                  </div>
                  <div className="leaderboard-mini">
                    <h3>🏆 Bảng điểm</h3>
                    {players.slice(0, 10).map((p, idx) => (
                      <div key={p.id} className="leaderboard-item">
                        <span className="rank">#{idx + 1}</span>
                        <span className="avatar">{p.avatar}</span>
                        <span className="name">{p.name}</span>
                        <span className="score">{p.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* PLAYER VIEW */}
        {!isAdmin && hasJoined && gameState.status !== "finished" && (
          <div className="game-container">
            <div className="control-panel">
              <div className="control-left">
                <div className="player-info">
                  <span className="player-avatar">{myPlayer?.avatar}</span>
                  <span>{myPlayer?.name}</span>
                  <span className="player-score">
                    🏆 {myPlayer?.score || 0}
                  </span>
                </div>
              </div>
              <div className="control-right">
                <div className="player-count">{players.length} người chơi</div>
              </div>
            </div>

            {/* Player - Waiting */}
            {gameState.status === "waiting" && (
              <div className="waiting-container">
                <div className="waiting-icon">🦆</div>
                <h2 className="waiting-title">SẴN SÀNG!</h2>
                <p className="waiting-text">
                  Đang chờ Admin bắt đầu cuộc đua...
                </p>

                {/* Bảng nội quy nhúng trong waiting */}
                <div className="rules-inline">
                  <h3>📋 NỘI QUY CHƠI GAME</h3>
                  <ul>
                    <li>
                      🏁 <strong>Đua:</strong> Spam CLICK hoặc SPACE để tiến về
                      đích
                    </li>
                    <li>
                      🏆 <strong>Về đích:</strong> Ai về trước được trả lời câu
                      hỏi
                    </li>
                    <li>
                      ⏱️ <strong>Thời gian:</strong> Có 7 giây để trả lời
                    </li>
                    <li>
                      ✅ <strong>Đúng:</strong> +10 điểm + QUAY ROULETTE 🎰
                    </li>
                    <li>
                      🎯 <strong>Sniper:</strong> Ai đạt 80%+ có thể bị BẮN lùi!
                    </li>
                    <li>
                      🏴‍☠️ <strong>Cướp:</strong> Sau 4s có thể cướp quyền trả
                      lời!
                    </li>
                    <li>
                      🚫 <strong>Gian lận:</strong> Dùng macro sẽ bị phạt!
                    </li>
                  </ul>
                </div>

                <div className="players-list">
                  <h3>Người chơi đã vào:</h3>
                  <div className="players-grid">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className={`player-chip ${
                          p.id === playerId ? "is-me" : ""
                        }`}
                      >
                        <span>{p.avatar}</span> {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Player - Racing */}
            {gameState.status === "racing" && (
              <div
                className="race-view"
                onMouseDown={handleRaceInput}
                onMouseUp={() => {
                  isKeyReleased.current = true;
                }}
                onTouchStart={handleRaceInput}
                onTouchEnd={() => {
                  isKeyReleased.current = true;
                }}
              >
                <div className="race-instruction">
                  <span className="race-hint">
                    🔥 SPAM CLICK HOẶC SPACE ĐỂ ĐUA! 🔥
                  </span>
                </div>
                <div className="race-track-container">
                  <div className="finish-line">
                    <span>ĐÍCH</span>
                  </div>
                  {sortedByPosition.map((p) => (
                    <div
                      key={p.id}
                      className={`player-lane ${
                        p.id === playerId ? "my-lane" : ""
                      }`}
                    >
                      <div className="lane-info">
                        <span>
                          {p.avatar} {p.name} {p.id === playerId && "(BẠN)"}
                        </span>
                        <span>{Math.round(p.position)}%</span>
                      </div>
                      <div className="lane-track">
                        <div
                          className="progress-bar"
                          style={{ width: `${p.position}%` }}
                        />
                        <div
                          className={`duck ${
                            p.id === playerId ? "duck-me" : ""
                          }`}
                          style={{ left: `${p.position}%` }}
                        >
                          {p.avatar}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tap-zone">
                  <button
                    className="tap-button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleRaceInput();
                    }}
                    onMouseUp={() => {
                      isKeyReleased.current = true;
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleRaceInput();
                    }}
                    onTouchEnd={() => {
                      isKeyReleased.current = true;
                    }}
                  >
                    👆 NHẤN ĐÂY ĐỂ ĐUA! 👆
                  </button>
                </div>

                {/* Power-ups UI */}
                {myPowerUps.length > 0 && !showFreezeSelection && (
                  <div className="powerups-container">
                    <div className="powerups-label">⚡ VẬT PHẨM:</div>
                    <div className="powerups-list">
                      {myPowerUps.map((pu, idx) => (
                        <div key={idx} className="powerup-item">
                          <button
                            className={`powerup-btn powerup-${pu.toLowerCase()}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              activatePowerUp(pu); // Sẽ tự hiện UI chọn người nếu là FREEZE
                            }}
                            title={POWER_UPS[pu]?.desc}
                          >
                            {POWER_UPS[pu]?.icon} {POWER_UPS[pu]?.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UI chọn người để FREEZE */}
                {showFreezeSelection && (
                  <div
                    className="freeze-selection-overlay"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="freeze-selection-box">
                      <h3>❄️ CHỌN NGƯỜI ĐỂ ĐÓNG BĂNG:</h3>
                      <div className="freeze-targets">
                        {players
                          .filter((p) => p.id !== playerId)
                          .map((p) => (
                            <button
                              key={p.id}
                              className="freeze-target-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                activatePowerUp("FREEZE", p.id);
                              }}
                            >
                              {p.avatar} {p.name}
                              <span className="position-hint">
                                ({Math.round(p.position)}%)
                              </span>
                            </button>
                          ))}
                      </div>
                      <button
                        className="cancel-freeze-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFreezeSelection(false);
                        }}
                      >
                        ✕ HỦY
                      </button>
                    </div>
                  </div>
                )}

                {/* Active power-up indicator */}
                {activePowerUp && (
                  <div
                    className={`active-powerup active-${activePowerUp.type.toLowerCase()}`}
                  >
                    {activePowerUp.type === "BOOST" && "⚡ TĂNG TỐC x2!"}
                    {activePowerUp.type === "FREEZE" &&
                      `❄️ ĐÓNG BĂNG ${activePowerUp.targetName}!`}
                    {activePowerUp.type === "BONUS" && "🎁 +10 ĐIỂM!"}
                    {activePowerUp.type === "SNIPER" &&
                      `🎯 BẮN TRÚNG ${activePowerUp.targetName}!`}
                  </div>
                )}

                {/* === SNIPER BUTTON === */}
                {sniperTarget &&
                  !sniperCooldown &&
                  sniperTarget.id !== playerId && (
                    <div
                      className="sniper-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="sniper-alert">
                        🎯 {sniperTarget.avatar} {sniperTarget.name} đang ở{" "}
                        {Math.round(sniperTarget.position)}%!
                      </div>
                      <button
                        className="sniper-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSnipe(sniperTarget.id);
                        }}
                      >
                        🔫 BẮN TỈA! (-{SNIPER_PENALTY}%)
                      </button>
                    </div>
                  )}

                {/* Frozen indicator */}
                {myPlayer?.frozen && (
                  <div className="frozen-overlay">
                    <span>❄️ BẠN BỊ ĐÓNG BĂNG! ❄️</span>
                  </div>
                )}

                {/* Macro Warning */}
                {macroWarning && (
                  <div className="macro-warning-overlay">
                    <div className="macro-warning-box">
                      <span className="warning-icon">🚨</span>
                      <h2>Á À! BẮT QUẢ TANG GIAN LẬN NHÉ!</h2>
                      <p>Spam quá nhanh rồi đó bạn ơi! 😤</p>
                      <p className="sub-text">Chơi fair play thôi nha~</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Player - Answering (Winner only) */}
            {gameState.status === "answering" && currentQuestion && (
              <div className="question-view">
                {gameState.winnerId === playerId ? (
                  <>
                    <div className="winner-banner you-won">
                      🎉 BẠN VỀ ĐÍCH TRƯỚC! HÃY TRẢ LỜI! 🎉
                    </div>
                    <div className="question-box">
                      {/* Timer thanh ngang */}
                      <div className="timer-bar-container">
                        <div
                          className={`timer-bar ${
                            answerTimer <= 3 ? "timer-bar-urgent" : ""
                          }`}
                          style={{
                            width: `${
                              (answerTimer / ANSWER_TIME_LIMIT) * 100
                            }%`,
                          }}
                        />
                        <span className="timer-bar-text">{answerTimer}s</span>
                      </div>
                      <p className="question-number">
                        Câu {gameState.currentQuestionIndex + 1}/
                        {TOTAL_QUESTIONS}
                      </p>
                      <p className="question-text">{currentQuestion.q}</p>
                      <div className="options-grid">
                        {currentQuestion.options.map((opt, idx) => (
                          <button
                            key={idx}
                            className="option-btn"
                            onClick={() => handleAnswer(idx)}
                          >
                            <span className="option-letter">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="waiting-answer">
                    <div className="waiting-icon">⏳</div>
                    <h2>
                      {winner?.avatar} {winner?.name} đang trả lời...
                    </h2>
                    {/* Timer thanh ngang cho người xem */}
                    <div className="timer-bar-container small">
                      <div
                        className={`timer-bar ${
                          answerTimer <= 3 ? "timer-bar-urgent" : ""
                        }`}
                        style={{
                          width: `${(answerTimer / ANSWER_TIME_LIMIT) * 100}%`,
                        }}
                      />
                      <span className="timer-bar-text">{answerTimer}s</span>
                    </div>

                    {/* === NÚT CƯỚP ĐÁP ÁN === */}
                    {canStealAnswer && (
                      <div className="steal-container">
                        <p className="steal-warning">
                          ⚠️ Cướp đúng +15đ, sai -15đ!
                        </p>
                        <button
                          className="steal-btn"
                          onClick={handleStealAnswer}
                        >
                          🏴‍☠️ CƯỚP ĐÁP ÁN!
                        </button>
                      </div>
                    )}

                    <p>Chờ xem kết quả nhé!</p>
                  </div>
                )}
              </div>
            )}

            {/* Player - Showing Answer */}
            {gameState.status === "showing_answer" && currentQuestion && (
              <div className="question-view">
                <div
                  className={`winner-banner ${
                    gameState.winnerAnswer === currentQuestion.answer
                      ? "correct-banner"
                      : gameState.winnerAnswer === -1
                      ? "timeout-banner"
                      : "wrong-banner"
                  }`}
                >
                  {gameState.winnerAnswer === currentQuestion.answer
                    ? `✅ ${winner?.name} trả lời ĐÚNG! +${POINTS_CORRECT} điểm`
                    : gameState.winnerAnswer === -1
                    ? `⏰ ${winner?.name} HẾT GIờ! ${POINTS_TIMEOUT} điểm`
                    : `❌ ${winner?.name} trả lời SAI!`}
                </div>
                <div className="question-box">
                  <p className="question-number">
                    Câu {gameState.currentQuestionIndex + 1}/{TOTAL_QUESTIONS}
                  </p>
                  <p className="question-text">{currentQuestion.q}</p>
                  <div className="options-grid">
                    {currentQuestion.options.map((opt, idx) => {
                      let cls = "option-btn";
                      if (idx === currentQuestion.answer)
                        cls += " option-correct";
                      else if (idx === gameState.winnerAnswer)
                        cls += " option-wrong";
                      return (
                        <button key={idx} className={cls} disabled>
                          <span className="option-letter">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="leaderboard-mini">
                  <h3>🏆 Bảng điểm</h3>
                  {players.slice(0, 5).map((p, idx) => (
                    <div
                      key={p.id}
                      className={`leaderboard-item ${
                        p.id === playerId ? "is-me" : ""
                      }`}
                    >
                      <span className="rank">#{idx + 1}</span>
                      <span className="avatar">{p.avatar}</span>
                      <span className="name">{p.name}</span>
                      <span className="score">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINISHED - PODIUM */}
        {gameState.status === "finished" && (
          <div className="finished-container">
            <div className="confetti-container">
              {CONFETTI_POSITIONS.map((pos, i) => (
                <div
                  key={i}
                  className="confetti-dot"
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    animationDelay: `${pos.delay}s`,
                  }}
                />
              ))}
            </div>

            <h1 className="finished-title">🎉 KẾT THÚC 🎉</h1>
            <h2 className="finished-subtitle">BỤC VINH DANH</h2>

            <div className="podium">
              <div className="podium-place second">
                {top3Players[1] ? (
                  <>
                    <div className="podium-avatar">{top3Players[1].avatar}</div>
                    <div className="podium-name">{top3Players[1].name}</div>
                    <div className="podium-score">
                      {top3Players[1].score} điểm
                    </div>
                    <div className="podium-block">
                      <Medal className="podium-icon silver" />
                      <span>2</span>
                    </div>
                  </>
                ) : (
                  <div className="podium-empty">-</div>
                )}
              </div>

              <div className="podium-place first">
                {top3Players[0] ? (
                  <>
                    <div className="podium-crown">👑</div>
                    <div className="podium-avatar">{top3Players[0].avatar}</div>
                    <div className="podium-name">{top3Players[0].name}</div>
                    <div className="podium-score">
                      {top3Players[0].score} điểm
                    </div>
                    <div className="podium-block">
                      <Trophy className="podium-icon gold" />
                      <span>1</span>
                    </div>
                  </>
                ) : (
                  <div className="podium-empty">-</div>
                )}
              </div>

              <div className="podium-place third">
                {top3Players[2] ? (
                  <>
                    <div className="podium-avatar">{top3Players[2].avatar}</div>
                    <div className="podium-name">{top3Players[2].name}</div>
                    <div className="podium-score">
                      {top3Players[2].score} điểm
                    </div>
                    <div className="podium-block">
                      <Award className="podium-icon bronze" />
                      <span>3</span>
                    </div>
                  </>
                ) : (
                  <div className="podium-empty">-</div>
                )}
              </div>
            </div>

            <div className="full-results">
              <h3>📊 Bảng xếp hạng đầy đủ</h3>
              <div className="results-list">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`result-item ${
                        p.id === playerId ? "is-me" : ""
                      }`}
                    >
                      <span className="result-rank">#{idx + 1}</span>
                      <span className="result-avatar">{p.avatar}</span>
                      <span className="result-name">{p.name}</span>
                      <span className="result-score">{p.score} điểm</span>
                    </div>
                  ))}
              </div>
            </div>

            {isAdmin && (
              <button onClick={resetGame} className="btn btn-play-again">
                <RefreshCw className="icon-sm" /> CHƠI LẠI
              </button>
            )}
          </div>
        )}

        {/* UI chọn Power-up khi đạt streak */}
        {showPowerUpSelection && (
          <div className="powerup-selection-overlay">
            <div className="powerup-selection-box">
              <h2>🎉 XUẤT SẮC! CHỌN VẬT PHẨM:</h2>
              <p className="streak-info">
                Bạn đã trả lời đúng {STREAK_FOR_POWERUP} câu liên tiếp!
              </p>
              <div className="powerup-choices">
                {Object.entries(POWER_UPS).map(([key, pu]) => (
                  <button
                    key={key}
                    className={`powerup-choice powerup-${key.toLowerCase()}`}
                    onClick={() => selectPowerUp(key)}
                  >
                    <span className="pu-icon">{pu.icon}</span>
                    <span className="pu-name">{pu.name}</span>
                    <span className="pu-desc">{pu.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Thông báo nhận power-up */}
        {showPowerUpGained && (
          <div className="powerup-gained">
            <h3>🎁 NHẬN ĐƯỢC VẬT PHẨM!</h3>
            <div className="icon">{showPowerUpGained.icon}</div>
            <div className="name">{showPowerUpGained.name}</div>
            <div className="desc">{showPowerUpGained.desc}</div>
          </div>
        )}

        {/* Rules Modal */}
        {showRules && (
          <div className="rules-overlay" onClick={() => setShowRules(false)}>
            <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
              <h2>📋 NỘI QUY CHƠI GAME</h2>
              <div className="rules-content">
                <div className="rule-section">
                  <h3>🎮 CÁCH CHƠI</h3>
                  <ul>
                    <li>
                      🏁 <strong>Đua:</strong> Spam CLICK hoặc nhấn SPACE liên
                      tục để tiến về đích
                    </li>
                    <li>
                      🏆 <strong>Về đích:</strong> Ai về trước được quyền trả
                      lời câu hỏi
                    </li>
                    <li>
                      ⏱️ <strong>Thời gian:</strong> Có 7 giây để trả lời mỗi
                      câu hỏi
                    </li>
                  </ul>
                </div>
                <div className="rule-section">
                  <h3>📊 TÍNH ĐIỂM</h3>
                  <ul>
                    <li>
                      ✅ <strong>Trả lời đúng:</strong> +10 điểm + QUAY ROULETTE
                    </li>
                    <li>
                      ❌ <strong>Trả lời sai:</strong> 0 điểm
                    </li>
                    <li>
                      ⏰ <strong>Hết giờ:</strong> -5 điểm
                    </li>
                  </ul>
                </div>
                <div className="rule-section">
                  <h3>🎰 VÒNG QUAY MAY RỦI</h3>
                  <ul>
                    <li>
                      🎁 <strong>x2 Điểm:</strong> Nhân đôi điểm vừa được
                    </li>
                    <li>
                      💀 <strong>Mất điểm:</strong> Mất điểm vừa được
                    </li>
                    <li>
                      🔄 <strong>Đổi điểm:</strong> Swap với người khác
                    </li>
                    <li>
                      🏴‍☠️ <strong>Cướp:</strong> Lấy 10đ từ người dẫn đầu
                    </li>
                  </ul>
                </div>
                <div className="rule-section warning">
                  <h3>🔥 TÍNH NĂNG CAY CÚ</h3>
                  <ul>
                    <li>
                      🎯 <strong>Sniper:</strong> Khi ai đạt 80%+, có thể BẮN họ
                      lùi 30%!
                    </li>
                    <li>
                      🏴‍☠️ <strong>Cướp đáp án:</strong> Sau 4s có thể cướp quyền
                      trả lời (đúng +15, sai -15)
                    </li>
                  </ul>
                </div>
                <div className="rule-section">
                  <h3>⚡ VẬT PHẨM</h3>
                  <ul>
                    <li>
                      🔥 <strong>Streak:</strong> Đúng 3 câu liên tiếp = nhận 1
                      vật phẩm
                    </li>
                    <li>
                      ❄️ <strong>Đóng Băng:</strong> Làm đối thủ đứng yên 3 giây
                    </li>
                    <li>
                      ⚡ <strong>Tăng Tốc:</strong> Tốc độ x2 trong 5 giây
                    </li>
                    <li>
                      🎁 <strong>Bonus:</strong> +10 điểm ngay lập tức
                    </li>
                  </ul>
                </div>
                <div className="rule-section warning">
                  <h3>🚫 LƯU Ý</h3>
                  <ul>
                    <li>Không được sử dụng macro/auto-clicker</li>
                    <li>Hệ thống sẽ phát hiện và phạt nếu spam quá nhanh</li>
                    <li>Chơi fair play để vui vẻ nhé! 😊</li>
                  </ul>
                </div>
              </div>
              <button
                className="btn btn-close-rules"
                onClick={() => setShowRules(false)}
              >
                ✓ ĐÃ HIỂU
              </button>
            </div>
          </div>
        )}

        {/* === VÒNG QUAY MAY RỦI === */}
        {showRoulette && (
          <div className="roulette-overlay">
            <div className="roulette-box">
              <h2>🎰 VÒNG QUAY MAY RỦI!</h2>
              {isSpinning ? (
                <div className="roulette-spinning">
                  <div className="roulette-wheel">
                    {ROULETTE_OPTIONS.map((opt, idx) => (
                      <div key={idx} className="roulette-item spinning">
                        {opt.icon}
                      </div>
                    ))}
                  </div>
                  <p>Đang quay...</p>
                </div>
              ) : rouletteResult ? (
                <div
                  className={`roulette-result result-${rouletteResult.effect}`}
                >
                  <div className="result-icon">{rouletteResult.icon}</div>
                  <div className="result-name">{rouletteResult.name}</div>
                  <p className="result-desc">
                    {rouletteResult.effect === "double" &&
                      `Điểm x2! +${lastAnswerPoints} thêm!`}
                    {rouletteResult.effect === "lose" &&
                      `Mất ${lastAnswerPoints} điểm vừa được!`}
                    {rouletteResult.effect === "swap" &&
                      "Đã đổi điểm với người khác!"}
                    {rouletteResult.effect === "bonus" && "+5 điểm bonus!"}
                    {rouletteResult.effect === "steal" &&
                      "Cướp 10 điểm từ người dẫn đầu!"}
                    {rouletteResult.effect === "nothing" &&
                      "May mắn! Không mất gì~"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
