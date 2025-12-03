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
} from "lucide-react";

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

  const lastPressTime = useRef(0);
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
        });
      });
      pList.sort((a, b) => b.score - a.score);
      setPlayers(pList);

      const me = pList.find((p) => p.id === playerId);
      if (me) {
        setHasJoined(true);
        setPlayerName(me.name);
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

    // Cooldown 50ms để chống lag
    const now = Date.now();
    if (now - lastPressTime.current < 50) return;
    lastPressTime.current = now;

    const myPlayer = players.find((p) => p.id === playerId);
    if (!myPlayer) return;

    const newPosition = Math.min(
      myPlayer.position + STEP_PER_CLICK,
      FINISH_LINE
    );

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
        handleRaceInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRaceInput]);

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

    // Cập nhật điểm nếu đúng
    if (isCorrect) {
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
      await updateDoc(playerRef, {
        score: (myPlayer?.score || 0) + POINTS_CORRECT,
      });
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
      updateDoc(d.ref, { score: 0, position: 0 });
    });
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
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <Terminal className="icon icon-pulse" />
          <h1 className="header-title">TƯ TƯỞNG HỒ CHÍ MINH</h1>
        </div>
        <div className="header-status">{statusText}</div>
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
                            : "wrong"
                        }`}
                      >
                        {gameState.winnerAnswer === currentQuestion.answer
                          ? `✅ ${winner?.name} trả lời ĐÚNG! +${POINTS_CORRECT} điểm`
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
              <div className="race-view" onClick={handleRaceInput}>
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
                  <button className="tap-button" onClick={handleRaceInput}>
                    👆 NHẤN ĐÂY ĐỂ ĐUA! 👆
                  </button>
                </div>
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
                      : "wrong-banner"
                  }`}
                >
                  {gameState.winnerAnswer === currentQuestion.answer
                    ? `✅ ${winner?.name} trả lời ĐÚNG! +${POINTS_CORRECT} điểm`
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
      </main>
    </div>
  );
}
