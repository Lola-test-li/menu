import { useEffect, useMemo, useRef, useState } from "react";
import { MENU_ID, SUPABASE_BUCKET, isCloudConfigured, supabase } from "./supabaseClient";

const STORAGE_KEY = "kitchen-menu-dishes-v2";
const starterDishes = [];
const MAX_IMAGE_SIZE = 960;
const IMAGE_QUALITY = 0.72;

const categories = ["全部", "早餐", "家常菜", "快手菜", "下饭菜", "小吃", "素菜", "汤羹", "主食"];

function readStoredDishes() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : starterDishes;
  } catch {
    return starterDishes;
  }
}

function dishFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    note: row.note || "自己上传的菜单记录",
    occasion: row.occasion || `适合今天：${row.category} · 自家味道`,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lastMade: "云端同步",
    favorite: Boolean(row.favorite),
    selected: true,
    image: row.image_url,
    imagePath: row.image_path,
  };
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
}

async function fetchCloudDishes() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("menu_id", MENU_ID)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(dishFromRow);
}

async function saveCloudDish(dish) {
  if (!supabase) return dish;

  const imagePath = `${MENU_ID}/${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`;
  const imageFile = dataUrlToFile(dish.image, "dish-photo.jpg");
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(imagePath, imageFile, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicImage } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(imagePath);

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      menu_id: MENU_ID,
      name: dish.name,
      category: dish.category,
      note: dish.note,
      occasion: dish.occasion,
      tags: dish.tags,
      favorite: dish.favorite,
      image_url: publicImage.publicUrl,
      image_path: imagePath,
    })
    .select()
    .single();

  if (error) throw error;
  return dishFromRow(data);
}

async function updateCloudFavorite(id, favorite) {
  if (!supabase) return;

  const { error } = await supabase
    .from("menu_items")
    .update({ favorite })
    .eq("id", id)
    .eq("menu_id", MENU_ID);

  if (error) throw error;
}

async function deleteCloudDish(dish) {
  if (!supabase) return;

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", dish.id)
    .eq("menu_id", MENU_ID);

  if (error) throw error;

  if (dish.imagePath) {
    await supabase.storage.from(SUPABASE_BUCKET).remove([dish.imagePath]);
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("图片读取失败，请换一张试试。"));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("图片格式无法识别，请换一张试试。"));
      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("当前浏览器无法处理图片，请换一张较小的照片。"));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
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
            aria-label="删除这张图片和记录"
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

function DishDetail({ dish, onClose, onDelete, onToggleFavorite }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="detail-head">
          <div>
            <p>{dish.category}</p>
            <h2>{dish.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="detail-image">
          <img src={dish.image} alt={dish.name} />
        </div>

        <div className="detail-body">
          <p>{dish.note}</p>
          {dish.tags.length > 0 && (
            <div className="detail-tags">
              {dish.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
          <div className="detail-meta">{dish.occasion}</div>
        </div>

        <div className="detail-actions">
          <button className="secondary-action" type="button" onClick={() => onToggleFavorite(dish.id)}>
            {dish.favorite ? "取消收藏" : "收藏"}
          </button>
          <button className="danger-action" type="button" onClick={() => onDelete(dish.id)}>
            删除这条记录
          </button>
        </div>
      </article>
    </div>
  );
}

function DishForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    category: "早餐",
    note: "",
    tags: "",
    image: "",
  });
  const [imageError, setImageError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const canSave = form.name.trim() && form.image && !isProcessingImage;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError("");
    setIsProcessingImage(true);

    try {
      const compressedImage = await compressImage(file);
      updateField("image", compressedImage);
    } catch (error) {
      updateField("image", "");
      setImageError(error instanceof Error ? error.message : "图片处理失败，请换一张试试。");
    } finally {
      setIsProcessingImage(false);
      event.target.value = "";
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!canSave) return;

    onSave({
      id: `dish-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      note: form.note.trim() || "自己上传的菜单记录",
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
            <p>添加记录</p>
            <h2>上传你的图片</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <label className="photo-drop">
          {form.image ? <img src={form.image} alt="菜品预览" /> : <span>{isProcessingImage ? "正在压缩照片..." : "选择照片"}</span>}
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
        {imageError && <p className="form-error">{imageError}</p>}

        <label>
          名称
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="比如：黑豆核桃豆浆"
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
            placeholder="口味、搭配、是否好喝都可以记"
          />
        </label>

        <label>
          标签
          <input
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="用逗号分隔，如 黄豆, 黑豆, 核桃"
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
  const [storageError, setStorageError] = useState("");
  const [cloudStatus, setCloudStatus] = useState(isCloudConfigured ? "正在连接云端..." : "本地模式");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [featuredId, setFeaturedId] = useState(dishes[0]?.id);
  const [activeDishId, setActiveDishId] = useState(dishes[0]?.id);
  const [isRolling, setIsRolling] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [detailDishId, setDetailDishId] = useState(null);
  const rollRef = useRef(null);
  const dishRefs = useRef(new Map());
  const rollerRefs = useRef(new Map());
  const pendingLocateRef = useRef(null);

  const featuredDish = useMemo(
    () => dishes.find((dish) => dish.id === featuredId) || dishes[0],
    [dishes, featuredId],
  );
  const detailDish = useMemo(
    () => dishes.find((dish) => dish.id === detailDishId),
    [detailDishId, dishes],
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
    if (!isCloudConfigured) return;

    let isCancelled = false;

    async function loadCloudDishes() {
      try {
        const cloudDishes = await fetchCloudDishes();
        if (isCancelled) return;
        setDishes(cloudDishes);
        setCloudStatus("云端同步已开启");
      } catch (error) {
        if (isCancelled) return;
        setCloudStatus("云端连接失败，暂时使用本地数据");
        setStorageError(error.message || "云端连接失败，请检查 Supabase 配置。");
      }
    }

    loadCloudDishes();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
      setStorageError("");
    } catch {
      setStorageError("照片太多或图片太大，浏览器本地空间不够。请删除一两道菜，或重新上传较小的照片。");
    }
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
    setDetailDishId(dish.id);
    locateDish(dish.id);
  }

  async function toggleFavorite(id) {
    const targetDish = dishes.find((dish) => dish.id === id);
    if (!targetDish) return;
    const nextFavorite = !targetDish.favorite;

    setDishes((current) =>
      current.map((dish) => (dish.id === id ? { ...dish, favorite: nextFavorite } : dish)),
    );

    if (isCloudConfigured) {
      try {
        await updateCloudFavorite(id, nextFavorite);
      } catch (error) {
        setStorageError(error.message || "收藏同步失败，请稍后再试。");
      }
    }
  }

  async function deleteDish(id) {
    const targetDish = dishes.find((dish) => dish.id === id);

    setDishes((current) => {
      const next = current.filter((dish) => dish.id !== id);
      if (featuredId === id) setFeaturedId(next[0]?.id);
      if (activeDishId === id) setActiveDishId(next[0]?.id);
      if (detailDishId === id) setDetailDishId(null);
      return next;
    });

    if (isCloudConfigured && targetDish) {
      try {
        await deleteCloudDish(targetDish);
      } catch (error) {
        setStorageError(error.message || "删除同步失败，请刷新后再试。");
      }
    }
  }

  async function addDish(dish) {
    if (isCloudConfigured) {
      try {
        const cloudDish = await saveCloudDish(dish);
        const nextDishes = [cloudDish, ...dishes];
        setDishes(nextDishes);
        setFeaturedId(cloudDish.id);
        if (!activeDishId) setActiveDishId(cloudDish.id);
        setCloudStatus("云端同步已开启");
      } catch (error) {
        setStorageError(error.message || "保存到云端失败，请检查 Supabase 配置。");
      }
      return;
    }

    const nextDishes = [dish, ...dishes];

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDishes));
    } catch {
      setStorageError("这张照片还是太大，保存失败。请换一张更小的照片再试。");
      return;
    }

    setDishes(nextDishes);
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

        <div className={`sync-badge ${isCloudConfigured ? "is-cloud" : ""}`}>{cloudStatus}</div>
        {storageError && <div className="app-alert">{storageError}</div>}
        {manageMode && (
          <div className="manage-tip">
            管理模式已开启：点击图片左上角的 ×，可以删除不想保留的图片和记录。
          </div>
        )}

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
              description="先上传早餐、豆浆配料或其他菜品图片，今日推荐和随机决定就会开始工作。"
              actionLabel="上传第一张图片"
              onAction={() => setShowForm(true)}
            />
          )}
        </section>

        <section className="quick-actions" aria-label="主要操作">
          <button type="button" onClick={() => setShowForm(true)}>
            <strong>上传照片</strong>
            <span>添加记录</span>
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
                description="上传图片后，这里会展示你最近添加的早餐、豆浆配料或菜品。"
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
      {detailDish && (
        <DishDetail
          dish={detailDish}
          onClose={() => setDetailDishId(null)}
          onDelete={deleteDish}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </main>
  );
}
