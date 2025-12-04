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
    q: "Theo Hồ Chí Minh, để công tác vận động quần chúng đạt hiệu quả, phương pháp tiếp cận không chỉ cần phù hợp với tâm tư nguyện vọng mà còn phải xuất phát từ yếu tố thực tế nào?",
    options: [
      "Xuất phát từ mệnh lệnh của cấp trên",
      "Xuất phát từ thực tế trình độ dân trí và văn hoá",
      "Xuất phát từ nguồn lực tài chính của địa phương",
      "Xuất phát từ kinh nghiệm chủ quan của cán bộ",
    ],
    answer: 1,
  },
  {
    q: "Trong khối đại đoàn kết dân tộc, các đoàn thể và tổ chức quần chúng (như Công đoàn, Đoàn Thanh niên...) được ví như điều gì trong mối quan hệ giữa Đảng, Chính phủ và Nhân dân?",
    options: [
      "Là cơ quan giám sát hành chính",
      "Là lực lượng vũ trang bảo vệ",
      "Là sợi dây gắn kết / liên lạc mật thiết",
      "Là đơn vị tài trợ kinh tế",
    ],
    answer: 2,
  },
  {
    q: "Hoàn thành câu nói nổi tiếng của Hồ Chí Minh về chiến lược công tác vận động quần chúng: 'Đoàn kết, đoàn kết, đại đoàn kết. _______, _______, đại _______!'",
    options: [
      "Chiến thắng, chiến thắng, đại chiến thắng",
      "Phát triển, phát triển, đại phát triển",
      "Thành công, thành công, đại thành công",
      "Hạnh phúc, hạnh phúc, đại hạnh phúc",
    ],
    answer: 2,
  },
  {
    q: "Nguyên tắc nào quy định rằng các thành viên trong Mặt trận phải tôn trọng lẫn nhau, cùng nhau bàn bạc, thỏa thuận khi có vấn đề chung, đảm bảo sự đồng thuận?",
    options: [
      "Tự phê bình và phê bình",
      "Đoàn kết trên cơ sở lợi ích dân tộc",
      "Hiệp thương dân chủ",
      "Đoàn kết rộng rãi",
    ],
    answer: 2,
  },
  {
    q: "Trong Tư tưởng Hồ Chí Minh, để củng cố và tăng cường Mặt trận dân tộc thống nhất, phải thường xuyên thực hiện nguyên tắc nào nhằm giúp các thành viên vượt qua sai lầm, khuyết điểm, từ đó giúp nhau cùng tiến bộ?",
    options: [
      "Hiệp thương dân chủ",
      "Lãnh đạo tuyệt đối của Đảng",
      "Đoàn kết rộng rãi, không phân biệt",
      "Thực hiện tự phê bình và phê bình",
    ],
    answer: 3,
  },
  {
    q: "Để đảm bảo khối đại đoàn kết được duy trì vững chắc và cùng nhau tiến bộ, Hồ Chí Minh yêu cầu các thành viên trong Mặt trận phải thực hiện phương châm hoạt động nào?",
    options: [
      "Thống nhất ý kiến và hành động tuyệt đối trong mọi vấn đề",
      "Ưu tiên phát triển các tổ chức thành viên có ảnh hưởng nhất",
      "Tự do cạnh tranh, tôn trọng lợi ích cá nhân",
      "Đoàn kết lâu dài, thật thà, thân ái, giúp đỡ nhau cùng tiến bộ",
    ],
    answer: 3,
  },
  {
    q: "Cùng hướng vào mục tiêu chung, Hồ Chí Minh đã đặt ra tiêu chí ban đầu nào để tập hợp tất cả mọi người dân vào khối thống nhất?",
    options: [
      "Mọi người dân đều phải là thành viên chính thức của Mặt trận Tổ quốc Việt Nam",
      "Phải có bằng cấp cao và kinh nghiệm lãnh đạo",
      "Ai có tài, có đức, có sức, có lòng phụng sự Tổ quốc và phục vụ nhân dân thì ta đoàn kết với họ",
      "Phải là công nhân hoặc nông dân trung thành",
    ],
    answer: 2,
  },
  {
    q: "Hồ Chí Minh chỉ rõ, trong quá trình xây dựng khối đại đoàn kết toàn dân tộc, cần phải đứng vững trên lập trường nào để đảm bảo sự định hướng cho khối đoàn kết?",
    options: [
      "Lập trường của tầng lớp trí thức",
      "Lập trường của Mặt trận Tổ quốc Việt Nam",
      "Lập trường của giai cấp nông dân",
      "Lập trường giai cấp công nhân",
    ],
    answer: 3,
  },
  {
    q: "Vai trò xuyên suốt và quan trọng nhất của tư tưởng Đại đoàn kết toàn dân tộc Hồ Chí Minh là gì?",
    options: [
      "Giúp Đảng Cộng sản Việt Nam định hướng chính sách kinh tế vĩ mô",
      "Đảm bảo sự lãnh đạo của giai cấp công nhân trong mọi thời kỳ",
      "Định hướng cho việc xây dựng khối đại đoàn kết toàn dân tộc trong suốt tiến trình cách mạng Việt Nam, từ cách mạng dân tộc dân chủ nhân dân đến cách mạng xã hội chủ nghĩa",
      "Chỉ tập trung giải quyết hài hòa mối quan hệ giữa các dân tộc anh em",
    ],
    answer: 2,
  },
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
      "Chỉ công nhân và nông dân",
      "Chỉ người trong Đảng",
      "Tất cả những ai có lòng yêu nước, kể cả người từng lầm đường lạc lối",
    ],
    answer: 3,
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
      "Đoàn kết chỉ cần trong thời chiến",
      "Đoàn kết trong Đảng là hạt nhân, phải giữ gìn sự đoàn kết như giữ gìn con ngươi của mắt mình",
      "Đoàn kết không cần thiết nếu có sức mạnh",
    ],
    answer: 2,
  },
  {
    q: "Theo Hồ Chí Minh, phẩm chất quan trọng nhất của người cán bộ là gì?",
    options: [
      "Tài giỏi",
      "Trung với nước, hiếu với dân",
      "Giàu có",
      "Ngoại hình đẹp",
    ],
    answer: 1,
  },
  {
    q: "Bác Hồ đã viết tác phẩm nào về đạo đức cách mạng?",
    options: [
      "Nhật ký trong tù",
      "Đường Kách Mệnh",
      "Sửa đổi lối làm việc",
      "Tuyên ngôn độc lập",
    ],
    answer: 2,
  },
];

const TOTAL_QUESTIONS = 20; // Giới hạn hiển thị 20 câu, sau đó lặp lại
const FINISH_LINE = 100; // % để về đích
const STEP_PER_CLICK = 2; // Mỗi click/space tiến bao nhiêu %
const POINTS_CORRECT = 10;
const POINTS_TIMEOUT = -5; // Trừ điểm khi hết giờ
const ANSWER_TIME_LIMIT = 7; // Giây
const SNIPER_THRESHOLD = 80; // % để có thể bị bắn tỉa
const SNIPER_PENALTY = 30; // Bị bắn lùi bao nhiêu %
const STEAL_TIME_THRESHOLD = 4; // Sau 4 giây có thể cướp đáp án
const STEAL_WRONG_PENALTY = -15; // Cướp mà sai thì -15 điểm

// Random Events - Sự kiện ngẫu nhiên xảy ra khi đua
const RANDOM_EVENTS = [
  {
    id: "earthquake",
    name: "🌋 ĐỘNG ĐẤT!",
    effect: "knockback_all",
    desc: "Tất cả lùi 15%!",
  },
  {
    id: "wind",
    name: "💨 GIÓ LỚN!",
    effect: "boost_all",
    desc: "Tất cả tiến 10%!",
  },
  {
    id: "banana",
    name: "🍌 CHUỐI!",
    effect: "random_slip",
    desc: "1 người random lùi 20%!",
  },
  {
    id: "reverse",
    name: "🔀 ĐẢO NGƯỢC!",
    effect: "reverse_positions",
    desc: "Đảo vị trí #1 và #cuối!",
  },
  {
    id: "shuffle",
    name: "🎲 XÁOẢI!",
    effect: "shuffle_positions",
    desc: "Random vị trí tất cả!",
  },
  {
    id: "gift",
    name: "🎁 QUÀ!",
    effect: "random_bonus",
    desc: "1 người random +10 điểm!",
  },
];

// Speed Traps - Vùng bẫy trên đường đua
const SPEED_TRAP_ZONES = [
  { start: 25, end: 35, name: "🕳️ HỐ XỊN" },
  { start: 55, end: 65, name: "🧊 BĂNG TRƠN" },
  { start: 75, end: 85, name: "🌊 SÓNG TO" },
];
const SPEED_TRAP_PENALTY = 0.5; // Chậm 50% khi trong trap
const RANDOM_EVENT_CHANCE = 0.03; // 3% mỗi lần click

// === SIÊU CAY FEATURES ===
const METEOR_CHANCE = 0.02; // 2% mỗi click có thiên thạch rơi
const METEOR_PENALTY = 30; // Thiên thạch trừ 30%
const BOUNTY_THRESHOLD = 60; // Người đứng nhất ở 60%+ có bounty
const BOUNTY_STEAL_PERCENT = 0.5; // Cướp 50% điểm khi vượt qua
const KARMA_BACKFIRE_CHANCE = 0.5; // 50% skill tự backfire khi karma cao
const KARMA_THRESHOLD = 3; // Karma >= 3 thì bị backfire

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
  const [sniperCooldown, setSniperCooldown] = useState(false); // Đã bắn chưa trong round này
  const [isInSpeedTrap, setIsInSpeedTrap] = useState(null); // Đang trong vùng bẫy nào

  // === SIÊU CAY STATES ===
  const [meteorStrike, setMeteorStrike] = useState(null); // { victim, victimId } - Thiên thạch đang rơi
  const [globalMeteor, setGlobalMeteor] = useState(false); // Thiên thạch rơi từ trên trời
  const [bountyTarget, setBountyTarget] = useState(null); // Người có bounty trên đầu
  const [karmaNotify, setKarmaNotify] = useState(null); // Thông báo karma backfire
  const [bananaLanes, setBananaLanes] = useState({}); // { playerId: position } - vỏ chuối trên từng lane
  const [waveEffect, setWaveEffect] = useState(null); // Hiệu ứng sóng nhẹ + text

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

  // === RANDOM EVENT - Sự kiện ngẫu nhiên khi đua ===
  const triggerRandomEvent = useCallback(async () => {
    if (players.length < 2) return;

    const event =
      RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];

    // Hiện wave effect + text nhỏ thay vì popup to
    setWaveEffect({ id: event.id, name: event.name, desc: event.desc });
    setTimeout(() => setWaveEffect(null), 2500);

    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const snap = await getDocs(playersRef);
    const playerDocs = [];
    snap.forEach((d) =>
      playerDocs.push({ ref: d.ref, data: d.data(), id: d.id })
    );

    switch (event.effect) {
      case "knockback_all":
        // Tất cả lùi 15%
        for (const p of playerDocs) {
          await updateDoc(p.ref, {
            position: Math.max(0, (p.data.position || 0) - 15),
          });
        }
        break;
      case "boost_all":
        // Tất cả tiến 10%
        for (const p of playerDocs) {
          await updateDoc(p.ref, {
            position: Math.min(FINISH_LINE - 5, (p.data.position || 0) + 10),
          });
        }
        break;
      case "random_slip": {
        // 1 người random bị chuối - hiện vỏ chuối trên lane của họ
        if (playerDocs.length > 0) {
          const victim =
            playerDocs[Math.floor(Math.random() * playerDocs.length)];
          const bananaPos = Math.random() * 80 + 10; // Random 10-90%

          // Hiện vỏ chuối trên lane của nạn nhân
          setBananaLanes((prev) => ({ ...prev, [victim.id]: bananaPos }));

          await updateDoc(victim.ref, {
            position: Math.max(0, (victim.data.position || 0) - 20),
          });

          // Xóa chuối sau 2s
          setTimeout(() => {
            setBananaLanes((prev) => {
              const newState = { ...prev };
              delete newState[victim.id];
              return newState;
            });
          }, 2000);
        }
        break;
      }
      case "reverse_positions": {
        // Đảo vị trí #1 và #cuối
        if (playerDocs.length >= 2) {
          const sorted = [...playerDocs].sort(
            (a, b) => (b.data.position || 0) - (a.data.position || 0)
          );
          const firstPos = sorted[0].data.position || 0;
          const lastPos = sorted[sorted.length - 1].data.position || 0;
          await updateDoc(sorted[0].ref, { position: lastPos });
          await updateDoc(sorted[sorted.length - 1].ref, {
            position: firstPos,
          });
        }
        break;
      }
      case "shuffle_positions": {
        // Xáo random vị trí tất cả
        const positions = playerDocs.map((p) => p.data.position || 0);
        for (let i = positions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        for (let i = 0; i < playerDocs.length; i++) {
          await updateDoc(playerDocs[i].ref, { position: positions[i] });
        }
        break;
      }
      case "random_bonus": {
        // 1 người random +10 điểm
        if (playerDocs.length > 0) {
          const lucky =
            playerDocs[Math.floor(Math.random() * playerDocs.length)];
          await updateDoc(lucky.ref, { score: (lucky.data.score || 0) + 10 });
        }
        break;
      }
      default:
        break;
    }
  }, [players.length]);

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
    let step = isBoosted ? STEP_PER_CLICK * 2 : STEP_PER_CLICK;

    // === SPEED TRAP: Kiểm tra có đang trong vùng bẫy không ===
    const currentTrap = SPEED_TRAP_ZONES.find(
      (trap) => myPlayer.position >= trap.start && myPlayer.position <= trap.end
    );
    if (currentTrap) {
      step = step * SPEED_TRAP_PENALTY; // Chậm 50%
      setIsInSpeedTrap(currentTrap);
    } else {
      setIsInSpeedTrap(null);
    }

    const newPosition = Math.min(myPlayer.position + step, FINISH_LINE);
    const oldPosition = myPlayer.position;

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

    // === ☄️ THIÊN THẠCH: 2% chance mỗi click ===
    if (Math.random() < METEOR_CHANCE && players.length > 1) {
      const victim = players[Math.floor(Math.random() * players.length)];
      const victimRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "players",
        victim.id
      );
      const newVictimPos = Math.max(0, (victim.position || 0) - METEOR_PENALTY);
      await updateDoc(victimRef, { position: newVictimPos });

      // Hiện thiên thạch rơi từ trên trời + đánh dấu nạn nhân
      setGlobalMeteor(true);
      setMeteorStrike({ victim, victimId: victim.id });
      setTimeout(() => {
        setGlobalMeteor(false);
        setMeteorStrike(null);
      }, 3000);
    }

    // === 🎯 BOUNTY HUNTER: Kiểm tra vượt qua người có bounty ===
    const leader = [...players].sort((a, b) => b.position - a.position)[0];
    if (
      leader &&
      leader.id !== playerId &&
      leader.position >= BOUNTY_THRESHOLD
    ) {
      setBountyTarget(leader);

      // Kiểm tra có vượt qua leader không
      if (oldPosition <= leader.position && newPosition > leader.position) {
        // VƯỢT QUA! Cướp 50% điểm
        const stolenPoints = Math.floor(
          (leader.score || 0) * BOUNTY_STEAL_PERCENT
        );
        if (stolenPoints > 0) {
          const leaderRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "players",
            leader.id
          );
          await updateDoc(leaderRef, {
            score: (leader.score || 0) - stolenPoints,
          });
          await updateDoc(playerRef, {
            score: (myPlayer.score || 0) + stolenPoints,
          });

          // Tăng karma cho người cướp
          await updateDoc(playerRef, { karma: (myPlayer.karma || 0) + 1 });

          setKarmaNotify({
            type: "steal",
            points: stolenPoints,
            from: leader.name,
          });
          setTimeout(() => setKarmaNotify(null), 2500);
        }
      }
    } else {
      setBountyTarget(null);
    }

    // === RANDOM EVENT: 3% chance mỗi click ===
    if (Math.random() < RANDOM_EVENT_CHANCE && !waveEffect) {
      triggerRandomEvent();
    }

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
  }, [
    playerId,
    gameState.status,
    gameState.winnerId,
    players,
    waveEffect,
    triggerRandomEvent,
  ]);

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

    const myPlayer = players.find((p) => p.id === playerId);
    const myKarma = myPlayer?.karma || 0;

    setSniperCooldown(true); // Chỉ được bắn 1 lần mỗi round

    // === 🔥 KARMA BACKFIRE: Nếu karma >= 3, 50% tự bắn mình! ===
    if (myKarma >= KARMA_THRESHOLD && Math.random() < KARMA_BACKFIRE_CHANCE) {
      // BACKFIRE! Tự bắn mình!
      const myRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "players",
        playerId
      );
      const newMyPos = Math.max(0, (myPlayer?.position || 0) - SNIPER_PENALTY);
      await updateDoc(myRef, { position: newMyPos });

      setKarmaNotify({ type: "backfire", action: "SNIPER" });
      setTimeout(() => setKarmaNotify(null), 2500);
      return;
    }

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

    // Tăng karma
    const myRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players",
      playerId
    );
    await updateDoc(myRef, { karma: myKarma + 1 });

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
      // Điểm đã được cộng trực tiếp, không cần vòng quay nữa
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

  const nextQuestion = useCallback(async () => {
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
      // Khi hết 20 câu, quay lại câu 0 và tăng số vòng
      const newRound = (gameState.totalRounds || 0) + 1;

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
        currentQuestionIndex: 0, // Quay lại câu đầu
        totalRounds: newRound,
        winnerId: null,
        winnerAnswer: null,
      });
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
  }, [gameState.currentQuestionIndex, gameState.totalRounds]);
  const stopGame = async () => {
    if (!window.confirm("Dừng game và tổng kết?")) return;

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
      status: "finished",
    });
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
      totalRounds: 0,
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

  // === AUTO NEXT QUESTION: Tự động chuyển câu sau 3 giây khi showing_answer ===
  useEffect(() => {
    if (gameState.status === "showing_answer" && isAdmin) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 3000); // 3 giây

      return () => clearTimeout(timer);
    }
  }, [gameState.status, isAdmin, nextQuestion]);

  // --- RENDER HELPERS ---
  const myPlayer = players.find((p) => p.id === playerId);
  const currentQuestion =
    QUESTIONS[gameState.currentQuestionIndex % QUESTIONS.length]; // Lặp lại câu hỏi
  const winner = players.find((p) => p.id === gameState.winnerId);
  const top3Players = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const sortedByPosition = [...players].sort((a, b) => b.position - a.position);

  const currentRound = gameState.totalRounds || 0;
  const questionInRound = gameState.currentQuestionIndex + 1;
  const totalAnswered =
    currentRound * TOTAL_QUESTIONS + gameState.currentQuestionIndex;

  const statusText =
    {
      waiting: "CHỜ BẮT ĐẦU",
      racing: `🏁 ĐUA ĐI! - Câu ${questionInRound}/${TOTAL_QUESTIONS} (Vòng ${
        currentRound + 1
      })`,
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
                {(gameState.status === "racing" ||
                  gameState.status === "answering" ||
                  gameState.status === "showing_answer") && (
                  <button onClick={stopGame} className="btn btn-danger">
                    ⏹️ DỪNG GAME
                  </button>
                )}
                {gameState.status === "waiting" && (
                  <button onClick={resetGame} className="btn btn-reset">
                    <RefreshCw className="icon-xs" /> RESET
                  </button>
                )}
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
                  🏁 ĐANG ĐUA - Câu {gameState.currentQuestionIndex + 1}/
                  {TOTAL_QUESTIONS} (Vòng {(gameState.totalRounds || 0) + 1})
                </h2>
                <div className="race-track-container">
                  <div className="finish-line">
                    <span>ĐÍCH</span>
                  </div>
                  {sortedByPosition.map((p, playerIndex) => (
                    <div key={p.id} className="player-lane">
                      <div className="lane-info">
                        <span>
                          {p.avatar} {p.name}
                        </span>
                        <span>{Math.round(p.position)}%</span>
                      </div>
                      <div className="lane-track">
                        {/* Speed Trap Zone - riêng từng lane */}
                        {SPEED_TRAP_ZONES.map((trap, idx) => {
                          const offset = (((playerIndex + idx) * 7) % 15) - 7;
                          return (
                            <div
                              key={idx}
                              className="lane-speed-trap"
                              style={{
                                left: `${trap.start + offset}%`,
                                width: `${trap.end - trap.start}%`,
                              }}
                              title={trap.name}
                            />
                          );
                        })}

                        {/* Vỏ chuối */}
                        {bananaLanes[p.id] !== undefined && (
                          <div
                            className="banana-on-lane"
                            style={{ left: `${bananaLanes[p.id]}%` }}
                          >
                            🍌
                          </div>
                        )}

                        <div
                          className="progress-bar"
                          style={{ width: `${p.position}%` }}
                        />
                        <div
                          className={`duck ${
                            meteorStrike?.victimId === p.id ? "meteor-hit" : ""
                          }`}
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
                      ✅ <strong>Đúng:</strong> +10 điểm | ⏱️ Hết giờ: -5 điểm
                    </li>
                    <li>
                      ☄️ <strong>Thiên thạch:</strong> Random rơi vào 1 người,
                      -30%!
                    </li>
                    <li>
                      💰 <strong>Bounty:</strong> Vượt người đứng đầu = cướp 50%
                      điểm!
                    </li>
                    <li>
                      🔥 <strong>Karma:</strong> Càng toxic càng dễ tự hại mình!
                    </li>
                    <li>
                      🎯 <strong>Sniper:</strong> Ai đạt 80%+ có thể bị BẮN lùi!
                    </li>
                    <li>
                      ⚠️ <strong>Speed Trap:</strong> Vùng đỏ = chậm 50%!
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
                  {sortedByPosition.map((p, playerIndex) => (
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
                        {/* Speed Trap Zone - riêng từng lane với offset random */}
                        {SPEED_TRAP_ZONES.map((trap, idx) => {
                          const offset = (((playerIndex + idx) * 7) % 15) - 7; // Random offset -7 to +7
                          return (
                            <div
                              key={idx}
                              className="lane-speed-trap"
                              style={{
                                left: `${trap.start + offset}%`,
                                width: `${trap.end - trap.start}%`,
                              }}
                              title={trap.name}
                            />
                          );
                        })}

                        {/* Vỏ chuối trên lane này */}
                        {bananaLanes[p.id] !== undefined && (
                          <div
                            className="banana-on-lane"
                            style={{ left: `${bananaLanes[p.id]}%` }}
                          >
                            🍌
                          </div>
                        )}

                        <div
                          className="progress-bar"
                          style={{ width: `${p.position}%` }}
                        />
                        <div
                          className={`duck ${
                            p.id === playerId ? "duck-me" : ""
                          } ${
                            meteorStrike?.victimId === p.id ? "meteor-hit" : ""
                          }`}
                          style={{ left: `${p.position}%` }}
                        >
                          {p.avatar}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Speed Trap Indicator */}
                {isInSpeedTrap && (
                  <div className="speed-trap-indicator">
                    ⚠️ {isInSpeedTrap.name} - TỐC ĐỘ GIẢM 50%!
                  </div>
                )}
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

            <div className="game-stats">
              <h3>📊 THỐNG KÊ GAME</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Tổng vòng chơi:</div>
                  <div className="stat-value">
                    {(gameState.totalRounds || 0) + 1}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tổng câu hỏi:</div>
                  <div className="stat-value">{totalAnswered}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Số người chơi:</div>
                  <div className="stat-value">{players.length}</div>
                </div>
              </div>
            </div>

            <div className="full-results">
              <h3>🏆 BẢNG XẾP HẠNG CUỐI CÙNG</h3>
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
                      ✅ <strong>Trả lời đúng:</strong> +10 điểm
                    </li>
                    <li>
                      ❌ <strong>Trả lời sai:</strong> 0 điểm
                    </li>
                    <li>
                      ⏰ <strong>Hết giờ:</strong> -5 điểm
                    </li>
                  </ul>
                </div>
                <div className="rule-section warning">
                  <h3>⚠️ CHƯỚNG NGẠI VẬT</h3>
                  <ul>
                    <li>
                      🕳️ <strong>Hố Xoáy (25-35%):</strong> Tốc độ giảm 50%
                    </li>
                    <li>
                      🧊 <strong>Băng Trơn (55-65%):</strong> Tốc độ giảm 50%
                    </li>
                    <li>
                      🌊 <strong>Sóng To (75-85%):</strong> Tốc độ giảm 50%
                    </li>
                  </ul>
                </div>
                <div className="rule-section warning">
                  <h3>🌋 RANDOM EVENT (3% mỗi click)</h3>
                  <ul>
                    <li>
                      🌋 <strong>Động Đất:</strong> Tất cả lùi 15%!
                    </li>
                    <li>
                      💨 <strong>Gió Lớn:</strong> Tất cả tiến 10%!
                    </li>
                    <li>
                      🍌 <strong>Chuối:</strong> 1 người random lùi 20%!
                    </li>
                    <li>
                      🔀 <strong>Đảo Ngược:</strong> Đổi vị trí #1 và #cuối!
                    </li>
                    <li>
                      🎲 <strong>Xáo Trộn:</strong> Random vị trí tất cả!
                    </li>
                    <li>
                      🎁 <strong>Quà:</strong> 1 người random +10 điểm!
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
                <div className="rule-section danger">
                  <h3>💀 ULTRA CAY CÚ</h3>
                  <ul>
                    <li>
                      ☄️ <strong>Thiên Thạch:</strong> 2% mỗi click = thiên
                      thạch rơi vào 1 người random, -30% quãng đường!
                    </li>
                    <li>
                      💰 <strong>Bounty Hunter:</strong> Người đứng đầu (60%+)
                      có tiền thưởng! Vượt qua họ = CƯỚP 50% điểm!
                    </li>
                    <li>
                      🔥 <strong>Karma:</strong> Càng toxic (snipe/cướp nhiều) =
                      karma tăng! Khi karma ≥3, 50% skill sẽ TỰ BẮN MÌNH!
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

        {/* === 🌊 WAVE EFFECT - Sóng lướt qua + text nhỏ === */}
        {waveEffect && (
          <>
            {/* Sóng lướt qua toàn màn hình */}
            <div className={`wave-sweep wave-${waveEffect.id}`}>
              <div className="wave-line wave-1"></div>
              <div className="wave-line wave-2"></div>
              <div className="wave-line wave-3"></div>
            </div>
            {/* Text nhỏ ở trên */}
            <div className="wave-text-bar">
              <span className="wave-icon">{waveEffect.name.split(" ")[0]}</span>
              <span className="wave-name">{waveEffect.name}</span>
              <span className="wave-desc">{waveEffect.desc}</span>
            </div>
          </>
        )}

        {/* === ☄️ THIÊN THẠCH - Rơi từ trên trời xuống === */}
        {globalMeteor && (
          <div className="meteor-rain">
            <div className="meteor-obj meteor-1">☄️</div>
            <div className="meteor-obj meteor-2">☄️</div>
            <div className="meteor-obj meteor-3">☄️</div>
            <div className="meteor-flash"></div>
          </div>
        )}
        {meteorStrike && (
          <div className="meteor-victim-bar">
            💥 {meteorStrike.victim.avatar} {meteorStrike.victim.name} bị thiên
            thạch! -{METEOR_PENALTY}%
          </div>
        )}

        {/* === 🎯 BOUNTY TARGET INDICATOR === */}
        {bountyTarget && gameState.status === "racing" && (
          <div className="bounty-indicator">
            <span className="bounty-icon">💰</span>
            <span className="bounty-text">
              BOUNTY: {bountyTarget.avatar} {bountyTarget.name}
            </span>
            <span className="bounty-reward">Vượt qua = Cướp 50% điểm!</span>
          </div>
        )}

        {/* === 🔥 KARMA NOTIFICATION === */}
        {karmaNotify && (
          <div className={`karma-overlay ${karmaNotify.type}`}>
            <div className="karma-box">
              {karmaNotify.type === "steal" && (
                <>
                  <div className="karma-icon">💰</div>
                  <h2>CƯỚP THÀNH CÔNG!</h2>
                  <p>
                    +{karmaNotify.points} điểm từ {karmaNotify.from}!
                  </p>
                  <p className="karma-warning">⚠️ Karma +1</p>
                </>
              )}
              {karmaNotify.type === "backfire" && (
                <>
                  <div className="karma-icon">💀</div>
                  <h2>KARMA BACKFIRE!</h2>
                  <p>{karmaNotify.action} TỰ BẮN VÀO MÌNH!</p>
                  <p className="karma-lesson">Ác giả ác báo! 😈</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
