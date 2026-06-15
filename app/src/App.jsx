import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kitchen-menu-dishes-v1";

const starterDishes = [
  {
    id: "pepper-pork",
    name: "小炒肉",
    category: "下饭菜",
    note: "香辣下饭，超级下饭的家常菜",
    occasion: "适合今天：下饭菜 · 2-3人 · 约20分钟",
    tags: ["五花肉", "青椒", "蒜苗", "微辣"],
    lastMade: "今日推荐",
    favorite: true,
    selected: true,
    image:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1100&q=88",
  },
  {
    id: "tomato-egg",
    name: "番茄炒蛋",
    category: "快手菜",
    note: "酸甜开胃，十分钟上桌",
    occasion: "适合今天：快手菜 · 1-2人 · 约10分钟",
    tags: ["番茄", "鸡蛋", "不辣"],
    lastMade: "2天前",
    favorite: true,
    selected: true,
    image:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=88",
  },
  {
    id: "ribs",
    name: "红烧排骨",
    category: "家常菜",
    note: "酱香浓郁，适合周末慢慢炖",
    occasion: "适合今天：硬菜 · 3-4人 · 约45分钟",
    tags: ["排骨", "冰糖", "酱香"],
    lastMade: "5天前",
    favorite: false,
    selected: true,
    image:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=88",
  },
  {
    id: "greens",
    name: "蒜蓉空心菜",
    category: "素菜",
    note: "清爽解腻，配肉菜刚刚好",
    occasion: "适合今天：素菜 · 2人 · 约8分钟",
    tags: ["空心菜", "大蒜", "清淡"],
    lastMade: "7天前",
    favorite: false,
    selected: true,
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=88",
  },
  {
    id: "tofu",
    name: "麻婆豆腐",
    category: "下饭菜",
    note: "热乎麻辣，拌饭很香",
    occasion: "适合今天：下饭菜 · 2-3人 · 约18分钟",
    tags: ["豆腐", "肉末", "麻辣"],
    lastMade: "8天前",
    favorite: true,
    selected: true,
    image:
      "https://images.unsplash.com/photo-1604633619441-7ff5f717481d?auto=format&fit=crop&w=900&q=88",
  },
  {
    id: "fish",
    name: "清蒸鲈鱼",
    category: "主食",
    note: "鲜香清淡，适合想吃舒服点",
    occasion: "适合今天：清淡菜 · 2-3人 · 约25分钟",
    tags: ["鲈鱼", "葱姜", "清淡"],
    lastMade: "收藏",
    favorite: true,
    selected: false,
    image:
      "https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?auto=format&fit=crop&w=900&q=88",
  },
  {
    id: "cauliflower",
    name: "干锅花菜",
    category: "素菜",
    note: "带点锅气，脆爽有味",
    occasion: "适合今天：素菜 · 2人 · 约15分钟",
    tags: ["花菜", "青红椒", "微辣"],
    lastMade: "收藏",
    favorite: false,
    selected: false,
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=88",
  },
  {
    id: "wings",
    name: "可乐鸡翅",
    category: "家常菜",
    note: "甜咸适口，小朋友也喜欢",
    occasion: "适合今天：家常菜 · 2-3人 · 约30分钟",
    tags: ["鸡翅", "可乐", "甜咸"],
    lastMade: "收藏",
    favorite: true,
    selected: false,
    image:
      "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=900&q=88",
  },
];

const categories = ["全部", "家常菜", "快手菜", "下饭菜", "小吃", "素菜", "汤羹", "主食"];

function readStoredDishes() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : starterDishes;
  } catch {
    return starterDishes;
  }
}

function DishThumb({ dish, active, manageMode, onChoose, onDelete, cardRef }) {
  return (
    <article
      className={`dish-thumb ${active ? "is-active" : ""}`}
      onClick={() => onChoose(dish)}
      ref={cardRef}
      data-dish-id={dish.id}
    >
      <div className="thumb-image">
        <img src={dish.image} alt={dish.name} />
        {manageMode && (
          <button
            className="delete-button"
            type="button"
            aria-label="删除菜品"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(dish.id);
            }}
          >
            ×
          </button>
        )}
      </div>
      <h3>{dish.name}</h3>
      <p>{dish.lastMade}</p>
    </article>
  );
}

function DishForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    category: "家常菜",
    note: "",
    tags: "",
    image: "",
  });

  const canSave = form.name.trim() && form.image;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateField("image", String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit(event) {
    event.preventDefault();
    if (!canSave) return;

    onSave({
      id: `dish-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      note: form.note.trim() || "自己上传的拿手菜",
      occasion: `适合今天：${form.category} · 自家味道`,
      tags: form.tags
        .split(/[，,\s]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4),
      lastMade: "刚添加",
      favorite: false,
      selected: true,
      image: form.image,
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="dish-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="form-head">
          <div>
            <p>添加新菜</p>
            <h2>上传你的菜照</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <label className="photo-drop">
          {form.image ? <img src={form.image} alt="菜品预览" /> : <span>选择照片</span>}
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>

        <label>
          菜名
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="比如：蒜香鸡腿"
          />
        </label>

        <label>
          分类
          <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
            {categories.filter((category) => category !== "全部").map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          简短备注
          <input
            value={form.note}
            onChange={(event) => updateField("note", event.target.value)}
            placeholder="口味、适合场景、做法灵感"
          />
        </label>

        <label>
          标签
          <input
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="用逗号分隔，如 鸡腿, 微辣, 快手"
          />
        </label>

        <button className="save-dish" type="submit" disabled={!canSave}>
          保存到菜单
        </button>
      </form>
    </div>
  );
}

export function App() {
  const [dishes, setDishes] = useState(readStoredDishes);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [featuredId, setFeaturedId] = useState(dishes[0]?.id);
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id);
  const [isRolling, setIsRolling] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const rollRef = useRef(null);
  const dishRefs = useRef(new Map());
  const rollerRefs = useRef(new Map());
  const pendingLocateRef = useRef(null);

  const featuredDish = useMemo(
    () => dishes.find((dish) => dish.id === featuredId) || dishes[0],
    [dishes, featuredId],
  );

  const filteredDishes = useMemo(() => {
    if (activeCategory === "全部") return dishes;
    return dishes.filter((dish) => dish.category === activeCategory);
  }, [activeCategory, dishes]);

  const recentDishes = useMemo(() => filteredDishes.filter((dish) => dish.lastMade !== "收藏"), [filteredDishes]);
  const favoriteDishes = useMemo(() => filteredDishes.filter((dish) => dish.favorite || dish.lastMade === "收藏"), [
    filteredDishes,
  ]);
  const rollingDishes = dishes;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
  }, [dishes]);

  useEffect(() => {
    if (!isRolling || !rollingDishes.length) return undefined;

    rollRef.current = window.setInterval(() => {
      const next = rollingDishes[Math.floor(Math.random() * rollingDishes.length)];
      setActiveDishId(next.id);
    }, 120);

    return () => window.clearInterval(rollRef.current);
  }, [isRolling, rollingDishes]);

  useEffect(() => {
    const currentRollerItem = rollerRefs.current.get(activeDishId);
    currentRollerItem?.scrollIntoView({ behavior: isRolling ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [activeDishId, isRolling]);

  useEffect(() => {
    if (!pendingLocateRef.current) return;

    const id = pendingLocateRef.current;
    pendingLocateRef.current = null;
    window.requestAnimationFrame(() => {
      const currentCard = dishRefs.current.get(id);
      currentCard?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  }, [activeCategory, filteredDishes]);

  function locateDish(id) {
    pendingLocateRef.current = id;
    if (activeCategory !== "全部") {
      setActiveCategory("全部");
      return;
    }

    window.requestAnimationFrame(() => {
      const currentCard = dishRefs.current.get(id);
      currentCard?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  }

  function stopRoll() {
    if (isRolling) {
      setIsRolling(false);
      locateDish(activeDishId);
      return;
    }
    setIsRolling(true);
  }

  function chooseDish(dish) {
    setActiveDishId(dish.id);
    setIsRolling(false);
    locateDish(dish.id);
  }

  function toggleFavorite(id) {
    setDishes((current) =>
      current.map((dish) => (dish.id === id ? { ...dish, favorite: !dish.favorite } : dish)),
    );
  }

  function deleteDish(id) {
    setDishes((current) => {
      const next = current.filter((dish) => dish.id !== id);
      if (featuredId === id) setFeaturedId(next[0]?.id);
      if (activeDishId === id) setActiveDishId(next[0]?.id);
      return next;
    });
  }

  function addDish(dish) {
    setDishes((current) => [dish, ...current]);
    setFeaturedId(dish.id);
  }

  function pickDaily() {
    if (!dishes.length) return;
    const pool = activeCategory === "全部" ? dishes : filteredDishes;
    const next = pool[Math.floor(Math.random() * pool.length)] || dishes[0];
    setFeaturedId(next.id);
  }

  function pickRandomDish() {
    if (!rollingDishes.length) return;
    const next = rollingDishes[Math.floor(Math.random() * rollingDishes.length)];
    setActiveDishId(next.id);
    setIsRolling(false);
    locateDish(next.id);
  }

  function setDishRef(id, node) {
    if (node) {
      dishRefs.current.set(id, node);
      return;
    }
    dishRefs.current.delete(id);
  }

  function setRollerRef(id, node) {
    if (node) {
      rollerRefs.current.set(id, node);
      return;
    }
    rollerRefs.current.delete(id);
  }

  return (
    <main className="app-shell">
      <section className="menu-app" aria-label="今天吃什么电子菜单">
        <header className="topbar">
          <div>
            <h1>今天吃什么</h1>
            <p>记录美食 · 轻松决定</p>
          </div>
          <button className="outline-action" type="button" onClick={() => setManageMode((value) => !value)}>
            我的菜单
          </button>
        </header>

        {featuredDish && (
          <section className="feature-block">
            <div className="section-title">
              <h2>今日推荐</h2>
              <button type="button" onClick={pickDaily}>
                每天推荐一道好菜 ↻
              </button>
            </div>
            <article className="hero-dish">
              <img src={featuredDish.image} alt={featuredDish.name} />
              <div className="hero-copy">
                <h3>{featuredDish.name}</h3>
                <p>{featuredDish.note}</p>
                <div className="tag-row">
                  {featuredDish.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
            <div className="occasion">
              <span>◌</span>
              <p>{featuredDish.occasion}</p>
              <button type="button" onClick={() => toggleFavorite(featuredDish.id)}>
                {featuredDish.favorite ? "已收藏" : "收藏"}
              </button>
            </div>
          </section>
        )}

        <section className="quick-actions" aria-label="主要操作">
          <button type="button" onClick={() => setShowForm(true)}>
            <strong>上传照片</strong>
            <span>添加新菜</span>
          </button>
          <button type="button" onClick={() => setShowForm(true)}>
            <strong>添加菜谱</strong>
            <span>手动创建</span>
          </button>
          <button type="button" onClick={() => setManageMode((value) => !value)}>
            <strong>筛选</strong>
            <span>{manageMode ? "完成管理" : "分类查看"}</span>
          </button>
        </section>

        <nav className="category-row" aria-label="菜品分类">
          {categories.map((category) => (
            <button
              className={activeCategory === category ? "is-active" : ""}
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>

        <section className="dish-section">
          <div className="section-title compact">
            <h2>最近做过</h2>
            <button type="button" onClick={() => setManageMode((value) => !value)}>
              {manageMode ? "完成" : "管理"}
            </button>
          </div>
          <div className="dish-strip">
            {(recentDishes.length ? recentDishes : filteredDishes).map((dish) => (
              <DishThumb
                key={dish.id}
                dish={dish}
                active={activeDishId === dish.id}
                manageMode={manageMode}
                onChoose={chooseDish}
                onDelete={deleteDish}
                cardRef={(node) => setDishRef(dish.id, node)}
              />
            ))}
          </div>
        </section>

        <section className="dish-section">
          <div className="section-title compact">
            <h2>收藏想吃</h2>
            <button type="button" onClick={() => setActiveCategory("全部")}>全部</button>
          </div>
          <div className="dish-strip">
            {(favoriteDishes.length ? favoriteDishes : filteredDishes).map((dish) => (
              <DishThumb
                key={dish.id}
                dish={dish}
                active={activeDishId === dish.id}
                manageMode={manageMode}
                onChoose={chooseDish}
                onDelete={deleteDish}
                cardRef={(node) => setDishRef(dish.id, node)}
              />
            ))}
          </div>
        </section>

        <aside className="roller" aria-label="随机决定吃什么">
          <div className="roller-label">
            <strong>随机决定</strong>
            <span>全部 {dishes.length} 道</span>
          </div>
          <button className="arrow-button" type="button" onClick={pickRandomDish} aria-label="上一道">
            ‹
          </button>
          <div className="roller-window">
            {rollingDishes.map((dish) => (
              <button
                className={activeDishId === dish.id ? "is-active" : ""}
                key={dish.id}
                type="button"
                onClick={() => chooseDish(dish)}
                ref={(node) => setRollerRef(dish.id, node)}
              >
                <img src={dish.image} alt={dish.name} />
                <span>{dish.name}</span>
              </button>
            ))}
          </div>
          <button className="arrow-button" type="button" onClick={pickRandomDish} aria-label="下一道">
            ›
          </button>
          <button className={`stop-button ${isRolling ? "is-running" : ""}`} type="button" onClick={stopRoll}>
            {isRolling ? "停止" : "开始"}
          </button>
        </aside>

        <footer className="hint">不知道吃什么？点击开始滚动，让它帮你决定吧！</footer>
      </section>

      {showForm && <DishForm onClose={() => setShowForm(false)} onSave={addDish} />}
    </main>
  );
}
