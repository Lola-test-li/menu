import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kitchen-menu-dishes-v2";
const starterDishes = [];

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

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
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
  const hasDishes = dishes.length > 0;

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
    if (!hasDishes) return;

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
    if (!activeDishId) setActiveDishId(dish.id);
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

        <section className="feature-block">
          <div className="section-title">
            <h2>今日推荐</h2>
            <button type="button" onClick={pickDaily} disabled={!hasDishes}>
              每天推荐一道好菜 ↻
            </button>
          </div>
          {featuredDish ? (
            <>
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
            </>
          ) : (
            <EmptyState
              title="菜单还是空的"
              description="先上传你自己的菜品照片，今日推荐和随机决定就会开始工作。"
              actionLabel="上传第一道菜"
              onAction={() => setShowForm(true)}
            />
          )}
        </section>

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
            {!filteredDishes.length && (
              <EmptyState
                title="暂无菜品"
                description="上传菜照后，这里会展示你最近添加的菜。"
                actionLabel="上传照片"
                onAction={() => setShowForm(true)}
              />
            )}
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
            {!filteredDishes.length && (
              <EmptyState
                title="还没有收藏"
                description="菜品添加后可以在今日推荐里收藏，也可以直接从全部菜品中选择。"
              />
            )}
          </div>
        </section>

        <aside className="roller" aria-label="随机决定吃什么">
          <div className="roller-label">
            <strong>随机决定</strong>
            <span>全部 {dishes.length} 道</span>
          </div>
          <button className="arrow-button" type="button" onClick={pickRandomDish} aria-label="上一道" disabled={!hasDishes}>
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
            {!hasDishes && <span className="roller-empty">等待导入菜品</span>}
          </div>
          <button className="arrow-button" type="button" onClick={pickRandomDish} aria-label="下一道" disabled={!hasDishes}>
            ›
          </button>
          <button className={`stop-button ${isRolling ? "is-running" : ""}`} type="button" onClick={stopRoll} disabled={!hasDishes}>
            {isRolling ? "停止" : "开始"}
          </button>
        </aside>

        <footer className="hint">不知道吃什么？点击开始滚动，让它帮你决定吧！</footer>
      </section>

      {showForm && <DishForm onClose={() => setShowForm(false)} onSave={addDish} />}
    </main>
  );
}
