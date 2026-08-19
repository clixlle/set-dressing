import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Plus, X, ChevronDown, ChevronRight, Trash2, Camera, Check, Clock, Circle, Boxes, Loader2, Download, Pencil, ClipboardPaste, GripVertical
} from "lucide-react";
import { supabase, rowToItem, itemToRow, supabaseConfigError, signIn, signOut, roleForEmail } from "./supabaseClient";

/* ============================== DESIGN TOKENS ============================== */
const T = {
  paper: "#14151F",       // app background (deep indigo)
  paperDeep: "#0D0E16",   // deepest background (modals, header wells)
  card: "#1C1D2B",        // card surface
  cardAlt: "#20212F",     // slightly raised surface (nested fields, popovers)
  field: "#181925",       // input/select field surface
  ink: "#F2F2F8",         // primary text (cool white)
  inkSoft: "#8C8DA6",     // secondary text (muted cool gray)
  line: "rgba(255,255,255,0.07)",   // hairline
  lineSoft: "rgba(255,255,255,0.04)",
  accentFrom: "#FF6F91",  // gradient accent — pink
  accentTo: "#FF9354",    // gradient accent — coral/orange
  accentSolid: "#FF7F63", // flat accent fallback
  danger: "#FF6B6B",
};
const ACCENT_GRADIENT = `linear-gradient(135deg, ${T.accentFrom} 0%, ${T.accentTo} 100%)`;

const STATUS_META = {
  "not-started": { label: "Not Started", short: "Not Started", iconColor: "#9A9BB5", badgeBg: "#2A2B3C", tint: "rgba(154,155,181,0.16)", icon: Circle },
  "in-progress": { label: "In Progress", short: "In Progress", iconColor: "#FF9354", badgeBg: "#3E2A22", tint: "rgba(255,147,84,0.18)", icon: Clock },
  "complete": { label: "Done", short: "Done", iconColor: "#2FD9B4", badgeBg: "#123B34", tint: "rgba(47,217,180,0.18)", icon: Check },
};
const STATUS_ORDER = ["not-started", "in-progress", "complete"];

/* ============================== DOMAIN DATA ============================== */
const STYLE_LIST = [
  { name: "Cottagecore", accent: "#8FA671" },
  { name: "Gothic", accent: "#584157" },
  { name: "Modern", accent: "#3E5C76" },
  { name: "Vintage", accent: "#B08968" },
  { name: "Victorian", accent: "#79434B" },
  { name: "Rustic", accent: "#7C5A3A" },
  { name: "Minimalist", accent: "#948C7D" },
  { name: "Scandinavian", accent: "#9AA084" },
  { name: "Industrial", accent: "#5A5754" },
  { name: "Traditional", accent: "#7A4E36" },
  { name: "Farmhouse", accent: "#8B9474" },
  { name: "Mid-Century Modern", accent: "#C97C3D" },
  { name: "Coastal", accent: "#5C8A8A" },
  { name: "Bohemian", accent: "#A85C4D" },
  { name: "Art Deco", accent: "#B08A3E" },
];
const STYLE_NAMES = [...STYLE_LIST.map((s) => s.name), "None"];

const CATEGORY_TYPES = [
  // Furniture
  { name: "Beds", singular: "Bed", room: "Bedroom", group: "Furniture" },
  { name: "Sofas", singular: "Sofa", room: "Living Room", group: "Furniture" },
  { name: "Loveseats", singular: "Loveseat", room: "Living Room", group: "Furniture" },
  { name: "Accent Chairs", singular: "Accent Chair", room: "Living Room", group: "Furniture" },
  { name: "Recliners", singular: "Recliner", room: "Living Room", group: "Furniture" },
  { name: "Chairs", singular: "Chair", room: "Living Room", group: "Furniture" },
  { name: "Tables", singular: "Table", room: "Living Room", group: "Furniture" },
  { name: "Console Tables", singular: "Console Table", room: "Entryway", group: "Furniture" },
  { name: "Desks", singular: "Desk", room: "Office", group: "Furniture" },
  { name: "Filing Cabinets", singular: "Filing Cabinet", room: "Office", group: "Furniture" },
  { name: "Dressers", singular: "Dresser", room: "Bedroom", group: "Furniture" },
  { name: "Vanity Tables", singular: "Vanity Table", room: "Bedroom", group: "Furniture" },
  { name: "Shelves", singular: "Shelf", room: "Office", group: "Furniture" },
  { name: "Wardrobes", singular: "Wardrobe", room: "Bedroom", group: "Furniture" },
  { name: "Nightstands", singular: "Nightstand", room: "Bedroom", group: "Furniture" },
  { name: "Changing Tables", singular: "Changing Table", room: "Nursery", group: "Furniture" },
  { name: "Benches", singular: "Bench", room: "Entryway", group: "Furniture" },
  { name: "Ottomans", singular: "Ottoman", room: "Living Room", group: "Furniture" },
  { name: "Coffee Tables", singular: "Coffee Table", room: "Living Room", group: "Furniture" },
  { name: "Dining Tables", singular: "Dining Table", room: "Dining Room", group: "Furniture" },
  { name: "Dining Chairs", singular: "Dining Chair", room: "Dining Room", group: "Furniture" },
  { name: "Bar Carts", singular: "Bar Cart", room: "Dining Room", group: "Furniture" },
  { name: "Bar Stools", singular: "Bar Stool", room: "Kitchen", group: "Furniture" },
  { name: "Bookcases", singular: "Bookcase", room: "Office", group: "Furniture" },
  { name: "TV Stands", singular: "TV Stand", room: "Living Room", group: "Furniture" },
  { name: "Room Dividers", singular: "Room Divider", room: "Living Room", group: "Furniture" },
  { name: "Storage Trunks", singular: "Storage Trunk", room: "Bedroom", group: "Furniture" },
  { name: "Garden Benches", singular: "Garden Bench", room: "Garden", group: "Furniture" },
  { name: "Patio Tables", singular: "Patio Table", room: "Outdoor", group: "Furniture" },
  { name: "Patio Chairs", singular: "Patio Chair", room: "Outdoor", group: "Furniture" },
  { name: "Hammocks", singular: "Hammock", room: "Outdoor", group: "Furniture" },
  // Decor & Lighting
  { name: "Ceiling Lights", singular: "Ceiling Light", room: "Living Room", group: "Decor" },
  { name: "Table Lamps", singular: "Table Lamp", room: "Bedroom", group: "Decor" },
  { name: "Floor Lamps", singular: "Floor Lamp", room: "Living Room", group: "Decor" },
  { name: "Wall Lamps", singular: "Wall Lamp", room: "Hallway", group: "Decor" },
  { name: "Chandeliers", singular: "Chandelier", room: "Dining Room", group: "Decor" },
  { name: "Pendant Lights", singular: "Pendant Light", room: "Kitchen", group: "Decor" },
  { name: "Outdoor Lanterns", singular: "Outdoor Lantern", room: "Outdoor", group: "Decor" },
  { name: "Vases", singular: "Vase", room: "Living Room", group: "Decor" },
  { name: "Books", singular: "Book Stack", room: "Office", group: "Decor" },
  { name: "Paintings", singular: "Painting", room: "Living Room", group: "Decor" },
  { name: "Wall Art", singular: "Wall Art", room: "Bedroom", group: "Decor" },
  { name: "Photo Frames", singular: "Photo Frame", room: "Living Room", group: "Decor" },
  { name: "Tapestries", singular: "Tapestry", room: "Bedroom", group: "Decor" },
  { name: "Mirrors", singular: "Mirror", room: "Bathroom", group: "Decor" },
  { name: "Rugs", singular: "Rug", room: "Living Room", group: "Decor" },
  { name: "Door Mats", singular: "Door Mat", room: "Entryway", group: "Decor" },
  { name: "Candles", singular: "Candle", room: "Bathroom", group: "Decor" },
  { name: "Clocks", singular: "Clock", room: "Living Room", group: "Decor" },
  { name: "Baskets", singular: "Basket", room: "Laundry Room", group: "Decor" },
  { name: "Sculptures", singular: "Sculpture", room: "Entryway", group: "Decor" },
  { name: "Garden Statues", singular: "Garden Statue", room: "Garden", group: "Decor" },
  { name: "Decorative Objects", singular: "Decorative Object", room: "Living Room", group: "Decor" },
  { name: "Throw Pillows", singular: "Throw Pillow", room: "Living Room", group: "Decor" },
  { name: "Curtains", singular: "Curtains", room: "Living Room", group: "Decor" },
  { name: "Coat Racks", singular: "Coat Rack", room: "Entryway", group: "Decor" },
  { name: "Umbrella Stands", singular: "Umbrella Stand", room: "Entryway", group: "Decor" },
];
const KIDS_FURNITURE = [
  { name: "Bunk Bed", room: "Kids Room" },
  { name: "Crib", room: "Nursery" },
  { name: "Toddler Bed", room: "Kids Room" },
  { name: "Kids Desk", room: "Kids Room" },
  { name: "Play Table", room: "Kids Room" },
];
const KIDS_FURNITURE_VARIANTS = ["Classic", "Painted", "Natural Wood", "Playful"];

// Real plant varieties — plants aren't tied to interior-design styles.
const PLANTS = [
  "Monstera", "Fiddle Leaf Fig", "Snake Plant", "Pothos", "Peace Lily",
  "Succulent Trio", "Areca Palm", "ZZ Plant", "Rubber Plant", "Aloe Vera",
  "Boston Fern", "Bird of Paradise", "Orchid", "Cactus", "English Ivy",
  "Spider Plant", "Eucalyptus Bundle", "Lavender Pot", "Rosemary Pot", "Bamboo Stalks",
  "Hanging Pothos", "Hanging Fern", "Hanging Ivy", "Potted Rose Bush", "Potted Hydrangea",
  "Herb Garden Box", "Succulent Wall Planter", "Tomato Planter", "Ferns Cluster", "Air Plant Set",
];

// Random miscellaneous objects / toys — not tied to a style either.
const MISC_OBJECTS = [
  { name: "Teddy Bear", room: "Kids Room" },
  { name: "Building Blocks Set", room: "Kids Room" },
  { name: "Toy Car", room: "Kids Room" },
  { name: "Rocking Horse", room: "Kids Room" },
  { name: "Dollhouse", room: "Kids Room" },
  { name: "Toy Train Set", room: "Kids Room" },
  { name: "Stuffed Animal Pile", room: "Kids Room" },
  { name: "Toy Bin", room: "Kids Room" },
  { name: "Puzzle Box", room: "Kids Room" },
  { name: "Board Game Stack", room: "Living Room" },
  { name: "Basketball", room: "Garage" },
  { name: "Soccer Ball", room: "Garage" },
  { name: "Skateboard", room: "Garage" },
  { name: "Bicycle", room: "Garage" },
  { name: "Toolbox", room: "Garage" },
  { name: "Beach Ball", room: "Outdoor" },
  { name: "Garden Hose Reel", room: "Garden" },
  { name: "Watering Can", room: "Garden" },
  { name: "Wheelbarrow", room: "Garden" },
  { name: "Bird Feeder", room: "Garden" },
  { name: "Umbrella (Patio)", room: "Outdoor" },
  { name: "Cooler", room: "Outdoor" },
  { name: "Grill", room: "Outdoor" },
  { name: "Laundry Hamper", room: "Laundry Room" },
  { name: "Iron & Board", room: "Laundry Room" },
  { name: "Stack of Towels", room: "Bathroom" },
  { name: "Bath Toys Set", room: "Bathroom" },
  { name: "Yoga Mat", room: "Bedroom" },
  { name: "Guitar", room: "Living Room" },
  { name: "Record Player", room: "Living Room" },
  { name: "Board Games Shelf", room: "Living Room" },
  { name: "Fish Tank", room: "Living Room" },
  { name: "Birdcage", room: "Living Room" },
  { name: "Globe", room: "Office" },
  { name: "Trophy Shelf", room: "Office" },
  { name: "Camera (Vintage)", room: "Living Room" },
  { name: "Suitcase Stack", room: "Bedroom" },
  { name: "Umbrella Stand Set", room: "Entryway" },
  { name: "Shoe Rack", room: "Entryway" },
  { name: "Welcome Sign", room: "Entryway" },
];

// Modular kitchen cabinet system — door profiles, handles, and toe kicks vary by style;
// worktop thickness and edge profile are universal technical specs shared across every style.
const KITCHEN_DOOR_PROFILES = STYLE_LIST.map((s) => `${s.name} Door Profile`);
const KITCHEN_HANDLES = STYLE_LIST.map((s) => `${s.name} Handle`);
const KITCHEN_TOE_KICKS = STYLE_LIST.map((s) => `${s.name} Toe Kick`);
const KITCHEN_WORKTOP_THICKNESSES = [
  "20mm Standard Worktop",
  "30mm Standard Worktop",
  "40mm Thick Worktop",
  "60mm Waterfall Build-Up Worktop",
];
const KITCHEN_WORKTOP_EDGE_PROFILES = [
  "Straight / Eased Edge",
  "Bullnose Edge",
  "Bevelled Edge",
  "Ogee Edge",
  "Waterfall Edge",
  "Live Edge",
  "Chamfered Edge",
  "Double Bullnose Edge",
];
const KITCHEN_MODULE_TYPES = ["Door Profile", "Handle", "Toe Kick", "Worktop Thickness", "Worktop Edge Profile"];

const TYPE_NAMES = [...CATEGORY_TYPES.map((c) => c.singular), ...KIDS_FURNITURE.map((k) => k.name), "Plant", "Miscellaneous", ...KITCHEN_MODULE_TYPES];
const FURNITURE_TYPES = [...CATEGORY_TYPES.filter((c) => c.group === "Furniture").map((c) => c.singular), ...KIDS_FURNITURE.map((k) => k.name)];
const DECOR_TYPES = [...CATEGORY_TYPES.filter((c) => c.group === "Decor").map((c) => c.singular), "Plant", "Miscellaneous"];
const MISC_TYPES = ["Miscellaneous"];
const KITCHEN_TYPES = KITCHEN_MODULE_TYPES;

const ROOMS = ["Living Room", "Kitchen", "Dining Room", "Bedroom", "Bathroom", "Office", "Entryway",
  "Hallway", "Laundry Room", "Outdoor", "Garden", "Garage", "Kids Room", "Nursery"];

function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

// A plain `.select("*")` silently caps out at Supabase's default 1000-row
// response limit — with 1000+ items in this library, that quietly cuts off
// whatever was inserted last (which happened to be the whole Kitchen System
// category). This fetches every row, no matter how many there are.
// Bump this only when buildSeedItems() changes in a way that needs a fresh
// reconciliation pass (new category, structural fix, etc). Otherwise the
// background cleanup below skips itself entirely on every normal load.
const RECONCILIATION_VERSION = "v3";

const ITEM_META_COLUMNS = "id,name,type,type_group,room,style,status,description,sort_order,created_at,updated_at";

// Prevents any single request from being able to hang the loading screen
// forever — if it doesn't resolve in time, this rejects with a clear message
// instead of leaving the user staring at a spinner indefinitely.
function withTimeout(promise, ms, label = "This") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} took too long and timed out`)), ms)),
  ]);
}

// Fetches everything EXCEPT photos — the list can render and become
// interactive immediately from this, without waiting for every photo in the
// whole library to download first.
async function fetchAllItemsMeta() {
  const pageSize = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from("items").select(ITEM_META_COLUMNS).range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// Fetches just id + photo — used by the admin reconciliation pass to check/shrink
// oversized photos. Not used for the regular list view (see fetchAllThumbnails).
async function fetchAllPhotos() {
  const pageSize = 500; // smaller pages — photo payloads are much heavier per row
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from("items").select("id,photo,thumbnail").range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// Fetches just id + thumbnail — this is what fills in row thumbnails after the
// fast metadata-only load. Thumbnails are small/compressed, so this is a much
// lighter request than pulling every full-quality photo just to show 90px previews.
async function fetchAllThumbnails() {
  const pageSize = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from("items").select("id,thumbnail").range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// Fetches the full-quality photo for a single item — used on-demand when
// that item is actually opened, rather than bulk-loading every full photo
// in the whole library up front.
async function fetchItemPhoto(id) {
  const { data, error } = await supabase.from("items").select("photo").eq("id", id).maybeSingle();
  if (error) { console.error("Photo fetch failed:", error); return null; }
  return data?.photo ?? null;
}

function typeGroupFor(typeName, customTypes = []) {
  const cat = CATEGORY_TYPES.find((c) => c.singular === typeName);
  if (cat) return cat.group;
  if (KIDS_FURNITURE.some((k) => k.name === typeName)) return "Furniture";
  if (typeName === "Plant") return "Decor";
  if (typeName === "Miscellaneous") return "Misc";
  if (KITCHEN_MODULE_TYPES.includes(typeName)) return "Kitchen";
  const custom = customTypes.find((c) => c.name === typeName);
  if (custom) return custom.group_name;
  return "Furniture";
}

function buildSeedItems() {
  const items = [];
  let idx = 0;

  // Every style gets every object type — full coverage, all starting Not Started.
  for (const style of STYLE_LIST) {
    for (const cat of CATEGORY_TYPES) {
      const now = Date.now() - (idx % 90) * 86400000;
      items.push({
        id: uid("item"),
        name: `${style.name} ${cat.singular}`,
        type: cat.singular,
        typeGroup: cat.group,
        room: cat.room,
        style: style.name,
        status: "not-started",
        photo: null,
        createdAt: now,
        updatedAt: now,
      });
      idx++;
    }
  }

  // A few kids'-furniture pieces — not one per style, just a handful of variants each.
  for (const kf of KIDS_FURNITURE) {
    for (const variant of KIDS_FURNITURE_VARIANTS) {
      const now = Date.now() - (idx % 90) * 86400000;
      items.push({
        id: uid("item"),
        name: `${variant} ${kf.name}`,
        type: kf.name,
        typeGroup: "Furniture",
        room: kf.room,
        style: "None",
        status: "not-started",
        photo: null,
        createdAt: now,
        updatedAt: now,
      });
      idx++;
    }
  }

  // Real plants — not tied to a design style.
  for (const plant of PLANTS) {
    const now = Date.now() - (idx % 90) * 86400000;
    items.push({
      id: uid("item"),
      name: plant,
      type: "Plant",
      typeGroup: "Decor",
      room: "Living Room",
      style: "None",
      status: "not-started",
      photo: null,
      createdAt: now,
      updatedAt: now,
    });
    idx++;
  }

  // Miscellaneous objects / toys — also not tied to a style.
  for (const obj of MISC_OBJECTS) {
    const now = Date.now() - (idx % 90) * 86400000;
    items.push({
      id: uid("item"),
      name: obj.name,
      type: "Miscellaneous",
      typeGroup: "Misc",
      room: obj.room,
      style: "None",
      status: "not-started",
      photo: null,
      createdAt: now,
      updatedAt: now,
    });
    idx++;
  }

  // Modular kitchen system — door profiles, handles, and toe kicks: one per style.
  const kitchenStyled = [
    { list: KITCHEN_DOOR_PROFILES, type: "Door Profile" },
    { list: KITCHEN_HANDLES, type: "Handle" },
    { list: KITCHEN_TOE_KICKS, type: "Toe Kick" },
  ];
  for (const group of kitchenStyled) {
    for (const name of group.list) {
      const now = Date.now() - (idx % 90) * 86400000;
      const style = STYLE_LIST.find((s) => name.startsWith(s.name))?.name || "None";
      items.push({
        id: uid("item"),
        name,
        type: group.type,
        typeGroup: "Kitchen",
        room: "Kitchen",
        style,
        status: "not-started",
        photo: null,
        createdAt: now,
        updatedAt: now,
      });
      idx++;
    }
  }
  // Worktop thickness and edge profile — universal technical specs, not tied to any style.
  const kitchenUniversal = [
    { list: KITCHEN_WORKTOP_THICKNESSES, type: "Worktop Thickness" },
    { list: KITCHEN_WORKTOP_EDGE_PROFILES, type: "Worktop Edge Profile" },
  ];
  for (const group of kitchenUniversal) {
    for (const name of group.list) {
      const now = Date.now() - (idx % 90) * 86400000;
      items.push({
        id: uid("item"),
        name,
        type: group.type,
        typeGroup: "Kitchen",
        room: "Kitchen",
        style: "None",
        status: "not-started",
        photo: null,
        createdAt: now,
        updatedAt: now,
      });
      idx++;
    }
  }

  return items;
}

/* ============================== SMALL UI HELPERS ============================== */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function StatusPicker({ status, onChange, width, className, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => { onOpenChange && onOpenChange(open); }, [open]);

  return (
    <div ref={ref} className={`sd-status-btn${className ? " " + className : ""}`} style={{ position: "relative", flexShrink: 0, width: width || 172 }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px 6px 6px", borderRadius: 999, minHeight: 44,
          border: "none",
          background: T.cardAlt,
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          cursor: "pointer",
        }}
      >
        <span style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: meta.badgeBg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} strokeWidth={2.5} color={meta.iconColor} />
        </span>
        <span style={{
          flex: 1, textAlign: "left", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontSize: 13, fontWeight: 600, color: T.ink,
        }}>
          {meta.short}
        </span>
        <ChevronDown size={14} color={T.inkSoft} style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100, width: "100%", minWidth: 180,
          background: T.cardAlt, borderRadius: 16,
          boxShadow: "0 16px 40px rgba(0,0,0,0.5)", padding: 6,
        }}>
          {STATUS_ORDER.map((s) => {
            const m = STATUS_META[s];
            const MIcon = m.icon;
            const active = s === status;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  padding: "6px 8px", borderRadius: 12, border: "none", cursor: "pointer", minHeight: 42,
                  background: active ? m.tint : "transparent",
                  marginBottom: 2,
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: m.badgeBg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MIcon size={12} strokeWidth={2.5} color={m.iconColor} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: active ? T.ink : T.inkSoft }}>{m.short}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Photo({ src, onUpload, size = 84, editable = true, className }) {
  const inputRef = useRef(null);
  return (
    <div
      className={className}
      onClick={(e) => { if (editable) { e.stopPropagation(); inputRef.current?.click(); } }}
      style={{
        width: size, height: size, borderRadius: 14, flexShrink: 0, overflow: "hidden",
        background: src ? "#fff" : T.field,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: editable ? "pointer" : "default", position: "relative",
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Camera size={size * 0.28} color={T.inkSoft} strokeWidth={1.5} />
      )}
      {editable && (
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(await fileToDataUrl(file));
            e.target.value = "";
          }} />
      )}
    </div>
  );
}

function downloadPhoto(dataUrl, name) {
  const ext = (dataUrl.match(/^data:image\/(\w+);/) || [, "png"])[1];
  const safeName = (name || "photo").replace(/[^a-z0-9\-_ ]/gi, "").trim().replace(/\s+/g, "-") || "photo";
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${safeName}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* Converts any image blob (JPEG, WEBP, whatever the clipboard gives us) to a PNG data URL. */
// Resizes to a sane max dimension before exporting — an uncapped camera photo
// or screenshot can be several MB, and with a library this size that adds up
// to a payload every single page load has to fully download before it can
// render anything. 1400px is plenty for a reference image.
function blobToPngDataUrl(blob, maxDimension = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDimension || h > maxDimension) {
        const scale = maxDimension / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Shrinks an already-stored photo if it's still oversized from before the
// upload cap existed. Returns null if it's already small enough to leave alone.
async function shrinkPhotoIfOversized(dataUrl, maxBytes = 350000, maxDimension = 1400) {
  if (!dataUrl || dataUrl.length <= maxBytes) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const resized = await blobToPngDataUrl(blob, maxDimension);
    return resized.length < dataUrl.length ? resized : null;
  } catch (e) {
    console.error("Photo shrink failed:", e);
    return null;
  }
}

// A small, compressed thumbnail for list rows — a 90px row doesn't need the
// same full-quality PNG as the detail view, and loading the full photo for
// every visible row is what was making thumbnails feel slow/missing.
function blobToThumbnailDataUrl(blob, maxDimension = 220, quality = 0.62) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDimension || h > maxDimension) {
        const scale = maxDimension / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // JPEG has no transparency — flatten onto white first
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

async function dataUrlToThumbnail(dataUrl) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return blobToThumbnailDataUrl(blob);
}

// Generates the full-quality photo and a small compressed thumbnail together
// from the same source blob, so an upload only needs to decode the image once.
async function processImageBlob(blob) {
  const [photo, thumbnail] = await Promise.all([
    blobToPngDataUrl(blob),
    blobToThumbnailDataUrl(blob),
  ]);
  return { photo, thumbnail };
}

function extractPastedImage(clipboardData) {
  const items = clipboardData?.items;
  if (!items) return null;
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}

/* A larger photo preview with Change / Delete / Download actions, used in the modals.
   Supports pasting an image (Ctrl/Cmd+V on desktop, or the Paste button on any
   device, since mobile browsers don't offer OS paste on a plain div) — always
   saved as a PNG. */
function PhotoField({ src, fullSrc, onUpload, onDelete, name }) {
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const [pasteError, setPasteError] = useState("");

  const handlePaste = async (e) => {
    const file = extractPastedImage(e.clipboardData);
    if (!file) return;
    e.preventDefault();
    const { photo, thumbnail } = await processImageBlob(file);
    onUpload(photo, thumbnail);
  };

  const pasteFromClipboard = async () => {
    setPasteError("");
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setPasteError("This browser doesn't support paste-from-clipboard here — use \"Add photo\" instead.");
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      const allTypesSeen = [];
      for (const item of clipboardItems) {
        allTypesSeen.push(...item.types);
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const { photo, thumbnail } = await processImageBlob(blob);
          onUpload(photo, thumbnail);
          return;
        }
      }
      console.log("Clipboard had content, but no image/* type. Types found:", allTypesSeen);
      if (allTypesSeen.length > 0) {
        setPasteError(`Your clipboard has something copied, but not as an image your browser can read directly (found: ${allTypesSeen.join(", ")}). This is common on mobile when copying from Photos — try "Add photo" instead, or copy an image from a webpage/browser rather than the Photos app.`);
      } else {
        setPasteError("Nothing found on your clipboard — copy an image first, then try again.");
      }
    } catch (err) {
      console.error("Clipboard read failed:", err);
      setPasteError(`Couldn't read the clipboard (${err.name || "error"}${err.message ? ": " + err.message : ""}) — use "Add photo" instead.`);
    }
  };

  return (
    <div>
      <div
        ref={boxRef}
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onPaste={handlePaste}
        style={{
          width: "100%", aspectRatio: "1 / 1", maxHeight: 280, borderRadius: 18, overflow: "hidden",
          background: src ? "#fff" : T.field, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", marginBottom: 12, position: "relative", outline: "none",
        }}
      >
        {src ? (
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.inkSoft, textAlign: "center", padding: 12 }}>
            <Camera size={40} strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Click to add a photo</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const { photo, thumbnail } = await processImageBlob(file);
              onUpload(photo, thumbnail);
            }
            e.target.value = "";
          }} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => inputRef.current?.click()} style={{
          display: "flex", alignItems: "center", gap: 6, background: T.cardAlt, color: T.ink, border: "none",
          borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
        }}>
          <Pencil size={13} /> {src ? "Change" : "Add"} photo
        </button>
        <button onClick={pasteFromClipboard} style={{
          display: "flex", alignItems: "center", gap: 6, background: T.cardAlt, color: T.ink, border: "none",
          borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
        }}>
          <ClipboardPaste size={13} /> Paste photo
        </button>
        {src && (
          <>
            <button onClick={() => downloadPhoto(fullSrc || src, name)} disabled={!fullSrc} style={{
              display: "flex", alignItems: "center", gap: 6, background: T.cardAlt, color: fullSrc ? T.ink : T.inkSoft, border: "none",
              borderRadius: 999, padding: "8px 14px", cursor: fullSrc ? "pointer" : "default", fontSize: 12.5, fontWeight: 700,
              opacity: fullSrc ? 1 : 0.6,
            }} title={fullSrc ? undefined : "Full-quality photo is still loading…"}>
              <Download size={13} /> Download
            </button>
            <button onClick={onDelete} style={{
              display: "flex", alignItems: "center", gap: 6, background: "rgba(255,107,107,0.12)", color: T.danger, border: "none",
              borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
            }}>
              <Trash2 size={13} /> Delete photo
            </button>
          </>
        )}
      </div>
      {pasteError && (
        <div style={{ fontSize: 12, color: T.danger, marginTop: 8, fontWeight: 600 }}>{pasteError}</div>
      )}
    </div>
  );
}

/* ============================== ITEM ROW ============================== */
const ItemRow = React.memo(function ItemRow({ item, onOpen, onStatusChange }) {
  const [statusOpen, setStatusOpen] = useState(false);
  return (
    <div
      className="sd-row"
      onClick={() => onOpen(item.id)}
      style={{
        background: T.card, borderRadius: 18, padding: 12,
        cursor: "pointer", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
        boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
        position: "relative", zIndex: statusOpen ? 30 : 1,
        transition: "transform .12s ease, box-shadow .12s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,0.4)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.22)"; }}
    >
      <div className="sd-row-main">
        <Photo className="sd-row-photo" src={item.thumbnail || item.photo} editable={false} size={92} />
        <div className="sd-row-text" style={{ flex: 1, minWidth: 0 }}>
          <div className="sd-row-name" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16.5, fontWeight: 700, color: T.ink, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.name}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.type} &middot; {item.room}
          </div>
        </div>
      </div>
      <StatusPicker className="sd-row-status" status={item.status} onChange={(s) => onStatusChange(item.id, s)} onOpenChange={setStatusOpen} />
    </div>
  );
});

/* ============================== ITEM MODAL (edit) ============================== */
/* A note box that can show under any section OR any single subcategory
   (e.g. the whole "Furniture" view, or just "Beds" within it). Admin can
   add/edit; everyone sees it once it has text. `compact` gives it a smaller
   footprint for inline use under a group header. */
function NoteBlock({ value, isAdmin, editing, onStartEdit, onCancelEdit, onSave, label, compact }) {
  const [draft, setDraft] = useState(value || "");
  useEffect(() => { if (editing) setDraft(value || ""); }, [editing]);

  if (!value && !isAdmin) return null;

  return (
    <div style={{
      background: T.cardAlt, borderLeft: `3px solid ${T.accentTo}`, borderRadius: compact ? 10 : 12,
      padding: compact ? "10px 12px" : "14px 16px", marginBottom: compact ? 10 : 16,
      fontSize: compact ? 12.5 : 13, lineHeight: 1.5, color: T.inkSoft,
    }}>
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={compact ? 2 : 4}
            placeholder={`Add a note for ${label}…`}
            style={{
              width: "100%", border: "none", borderRadius: 10, padding: "9px 11px", fontSize: compact ? 12.5 : 13,
              fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.field, color: T.ink,
              boxSizing: "border-box", resize: "vertical", marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={async () => { const ok = await onSave(draft); if (ok) onCancelEdit(); }} style={{
              background: T.accentTo, color: "#1A0F0A", border: "none", borderRadius: 999, padding: "6px 12px",
              fontSize: 11.5, fontWeight: 800, cursor: "pointer",
            }}>Save note</button>
            <button onClick={onCancelEdit} style={{
              background: "none", color: T.inkSoft, border: "none", borderRadius: 999, padding: "6px 12px",
              fontSize: 11.5, fontWeight: 700, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      ) : value ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <span style={{ whiteSpace: "pre-wrap" }}>{value}</span>
          {isAdmin && (
            <button onClick={onStartEdit} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 4, color: T.inkSoft, display: "flex" }} title="Edit this note">
              <Pencil size={compact ? 12 : 14} />
            </button>
          )}
        </div>
      ) : (
        <button onClick={onStartEdit} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer",
          color: T.accentTo, fontSize: compact ? 11.5 : 12.5, fontWeight: 700, padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <Plus size={compact ? 11 : 13} /> Add a note for {label}
        </button>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.inkSoft, marginBottom: 7, display: "block" }}>{label}</span>
      <div style={{ padding: "11px 12px", borderRadius: 12, background: T.field, color: T.ink, fontSize: 14, minHeight: 20, whiteSpace: "pre-wrap" }}>{value || "—"}</div>
    </div>
  );
}

/* Full-size, click-to-open photo view with a Download button — used for the
   read-only (modeler) view, where viewing/downloading is allowed but editing isn't. */
function ViewablePhoto({ src, fullSrc, name }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <img
          src={src} alt="" onClick={() => setOpen(true)}
          style={{ width: "100%", aspectRatio: "1 / 1", maxHeight: 280, objectFit: "cover", borderRadius: 18, cursor: "zoom-in" }}
        />
        <button onClick={() => downloadPhoto(fullSrc || src, name)} disabled={!fullSrc} style={{
          display: "flex", alignItems: "center", gap: 6, background: T.cardAlt, color: fullSrc ? T.ink : T.inkSoft, border: "none",
          borderRadius: 999, padding: "8px 14px", cursor: fullSrc ? "pointer" : "default", fontSize: 12.5, fontWeight: 700, marginTop: 10,
          opacity: fullSrc ? 1 : 0.6,
        }} title={fullSrc ? undefined : "Full-quality photo is still loading…"}>
          <Download size={13} /> Download photo
        </button>
      </div>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(4,4,8,0.92)", zIndex: 80,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out",
          }}
        >
          <button onClick={() => setOpen(false)} style={{
            position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <X size={20} color="#fff" />
          </button>
          <img src={fullSrc || src} alt="" style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 12 }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function ItemModal({ item, isAdmin, onClose, onSave, onStatusChange, onDelete, furnitureTypes, decorTypes, kitchenTypes, customTypes, rooms, styles }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item.id]);
  const inputStyle = { width: "100%", border: "none", borderRadius: 12, padding: "11px 12px", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.field, color: T.ink, boxSizing: "border-box" };
  const labelStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.inkSoft, marginBottom: 7, display: "block" };

  return (
    <div className="sd-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(6,6,10,0.72)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }} onClick={onClose}>
      <div className="sd-modal" style={{ background: T.paperDeep, borderRadius: 26, maxWidth: 460, width: "100%", padding: 26, boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: T.ink }}>{isAdmin ? "Edit item" : draft.name}</span>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color={T.inkSoft} /></button>
        </div>

        {isAdmin ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <span style={labelStyle}>Name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <span style={labelStyle}>Photo</span>
              <PhotoField src={draft.photo || draft.thumbnail} fullSrc={draft.photo} name={draft.name} onUpload={(photo, thumbnail) => setDraft({ ...draft, photo, thumbnail })} onDelete={() => setDraft({ ...draft, photo: null, thumbnail: null })} />
            </div>

            <div className="sd-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <span style={labelStyle}>Object type</span>
                <select value={draft.type} onChange={(e) => {
                  setDraft({ ...draft, type: e.target.value, typeGroup: typeGroupFor(e.target.value, customTypes) });
                }} style={inputStyle}>
                  <optgroup label="Furniture">{furnitureTypes.map((t) => <option key={t}>{t}</option>)}</optgroup>
                  <optgroup label="Decor">{decorTypes.map((t) => <option key={t}>{t}</option>)}</optgroup>
                  <optgroup label="Kitchen System">{kitchenTypes.map((t) => <option key={t}>{t}</option>)}</optgroup>
                </select>
              </div>
              <div>
                <span style={labelStyle}>Style</span>
                <select value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} style={inputStyle}>
                  {styles.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={labelStyle}>Room</span>
                <select value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} style={inputStyle}>
                  {rooms.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <span style={labelStyle}>Description</span>
              <textarea
                value={draft.description || ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Notes, specs, or anything future you (or a teammate) should know about this piece…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>
          </>
        ) : (
          <>
            <ViewablePhoto src={draft.photo || draft.thumbnail} fullSrc={draft.photo} name={draft.name} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <ReadOnlyField label="Object type" value={draft.type} />
              <ReadOnlyField label="Style" value={draft.style} />
              <div style={{ gridColumn: "1 / -1" }}><ReadOnlyField label="Room" value={draft.room} /></div>
            </div>
            {draft.description && (
              <div style={{ marginBottom: 18 }}><ReadOnlyField label="Description" value={draft.description} /></div>
            )}
          </>
        )}

        <div style={{ marginBottom: 22 }}>
          <span style={labelStyle}>Status</span>
          <StatusPicker status={draft.status} onChange={(s) => { setDraft((d) => ({ ...d, status: s })); onStatusChange(draft.id, s); }} width={200} />
        </div>

        {isAdmin && (
          <div className="sd-modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
            <button onClick={() => onDelete(draft.id)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5, fontWeight: 700, padding: "8px 4px", flexShrink: 0 }}>
              <Trash2 size={14} /> Delete
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: 999, padding: "10px 18px", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: T.inkSoft, minHeight: 40 }}>Cancel</button>
              <button onClick={() => onSave({ ...draft, updatedAt: Date.now() })} style={{ background: ACCENT_GRADIENT, color: "#1A0F0A", border: "none", borderRadius: 999, padding: "10px 22px", cursor: "pointer", fontSize: 13.5, fontWeight: 800, minHeight: 40, boxShadow: `0 6px 20px ${T.accentTo}44` }}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== ADD ITEM MODAL ============================== */
function AddItemModal({ onClose, onCreate, furnitureTypes, decorTypes, kitchenTypes, customTypes, rooms, styles }) {
  const [draft, setDraft] = useState({ name: "", type: TYPE_NAMES[0], typeGroup: CATEGORY_TYPES[0].group, room: ROOMS[0], style: STYLE_NAMES[0], status: "not-started", photo: null, thumbnail: null, description: "" });
  const inputStyle = { width: "100%", border: "none", borderRadius: 12, padding: "11px 12px", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.field, color: T.ink, boxSizing: "border-box" };
  const labelStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.inkSoft, marginBottom: 7, display: "block" };

  const suggestedName = draft.name || `${draft.style} ${draft.type}`;

  const create = () => {
    const now = Date.now();
    onCreate({ ...draft, name: (draft.name || suggestedName).trim(), id: uid("item"), createdAt: now, updatedAt: now });
  };

  return (
    <div className="sd-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }} onClick={onClose}>
      <div className="sd-modal" style={{ background: T.paperDeep, borderRadius: 26, maxWidth: 460, width: "100%", padding: 26, boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: T.ink }}>New item</span>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color={T.inkSoft} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Name</span>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={suggestedName} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Photo</span>
          <PhotoField src={draft.photo || draft.thumbnail} fullSrc={draft.photo} name={draft.name || suggestedName} onUpload={(photo, thumbnail) => setDraft({ ...draft, photo, thumbnail })} onDelete={() => setDraft({ ...draft, photo: null, thumbnail: null })} />
        </div>

        <div className="sd-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          <div>
            <span style={labelStyle}>Object type</span>
            <select value={draft.type} onChange={(e) => {
              setDraft({ ...draft, type: e.target.value, typeGroup: typeGroupFor(e.target.value, customTypes) });
            }} style={inputStyle}>
              <optgroup label="Furniture">{furnitureTypes.map((t) => <option key={t}>{t}</option>)}</optgroup>
              <optgroup label="Decor">{decorTypes.map((t) => <option key={t}>{t}</option>)}</optgroup>
              <optgroup label="Kitchen System">{kitchenTypes.map((t) => <option key={t}>{t}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <span style={labelStyle}>Style</span>
            <select value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} style={inputStyle}>
              {styles.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Room</span>
            <select value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} style={inputStyle}>
              {rooms.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <span style={labelStyle}>Description</span>
          <textarea
            value={draft.description || ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Notes, specs, or anything future you (or a teammate) should know about this piece…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
        </div>

        <div className="sd-modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: 999, padding: "10px 18px", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: T.inkSoft, minHeight: 40 }}>Cancel</button>
          <button onClick={create} style={{ background: ACCENT_GRADIENT, color: "#1A0F0A", border: "none", borderRadius: 999, padding: "10px 22px", cursor: "pointer", fontSize: 13.5, fontWeight: 800, minHeight: 40, boxShadow: `0 6px 20px ${T.accentTo}44` }}>Add item</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== ROOT APP ============================== */
function SortMenu({ organizeKey, specificValue, onPick, organizeOptions, isAdmin, onAddCategory }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [addingTo, setAddingTo] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const activeMode = organizeOptions.find((o) => o.key === organizeKey) || organizeOptions[0];
  const currentLabel = specificValue ? specificValue : `All by ${activeMode.label}`;

  const submitNewCategory = (groupKey) => {
    const name = newCategoryName.trim();
    if (!name) return;
    onAddCategory(groupKey, name);
    setNewCategoryName("");
    setAddingTo("");
  };

  return (
    <div ref={ref} className="sd-sortmenu" style={{ position: "relative" }}>
      <button
        className="sd-sortmenu-btn"
        onClick={() => { setOpen((v) => !v); setExpanded(""); setAddingTo(""); }}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999,
          border: "none", background: T.card, fontSize: 13.5, color: T.ink, cursor: "pointer",
          minHeight: 42, width: "100%", maxWidth: 320, boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0 }}>Sort:</span>
        <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{currentLabel}</span>
        <ChevronDown size={14} color={T.inkSoft} style={{ flexShrink: 0, marginLeft: "auto" }} />
      </button>

      {open && (
        <div className="sd-sortmenu-panel" style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 60,
          width: "min(300px, 82vw)",
          background: T.cardAlt, borderRadius: 18, boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          padding: 8, maxHeight: 400, overflowY: "auto",
        }}>
          {organizeOptions.map((o) => (
            <div key={o.key}>
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <button
                  onClick={() => { onPick(o.key, ""); setOpen(false); }}
                  style={{
                    flex: 1, textAlign: "left", padding: "10px 12px",
                    background: organizeKey === o.key && !specificValue ? "rgba(255,255,255,0.06)" : "none",
                    border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: T.ink,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {o.label} <span style={{ color: T.inkSoft, fontWeight: 500, fontSize: 12 }}>— show all</span>
                </button>
                <button
                  onClick={() => setExpanded((v) => (v === o.key ? "" : o.key))}
                  title={`Pick a specific ${o.label.toLowerCase()}`}
                  style={{ width: 34, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {expanded === o.key ? <ChevronDown size={15} color={T.inkSoft} /> : <ChevronRight size={15} color={T.inkSoft} />}
                </button>
              </div>
              {expanded === o.key && (
                <div style={{ paddingLeft: 10, marginBottom: 4 }}>
                  {o.values.map((v) => (
                    <button
                      key={v}
                      onClick={() => { onPick(o.key, v); setOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13,
                        background: organizeKey === o.key && specificValue === v ? "rgba(255,255,255,0.06)" : "none",
                        border: "none", borderRadius: 10, cursor: "pointer", color: T.inkSoft,
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                  {isAdmin && onAddCategory && o.key !== "all" && (
                    addingTo === o.key ? (
                      <div style={{ display: "flex", gap: 6, padding: "6px 4px" }}>
                        <input
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") submitNewCategory(o.key); if (e.key === "Escape") setAddingTo(""); }}
                          placeholder="New category name"
                          style={{
                            flex: 1, minWidth: 0, border: "none", borderRadius: 8, padding: "7px 9px", fontSize: 12.5,
                            background: T.field, color: T.ink, fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        />
                        <button onClick={() => submitNewCategory(o.key)} style={{
                          background: T.accentTo, color: "#1A0F0A", border: "none", borderRadius: 8, padding: "0 10px",
                          fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0,
                        }}>Add</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingTo(o.key); setNewCategoryName(""); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", padding: "8px 12px",
                          fontSize: 12.5, background: "none", border: "none", borderRadius: 10, cursor: "pointer",
                          color: T.accentTo, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
                        }}
                      >
                        <Plus size={12} /> New category
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== LOGIN SCREEN ============================== */
function LoginScreen({ onSignedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setError("");
    const { error: signInError } = await signIn(username, password);
    setSubmitting(false);
    if (signInError) {
      setError("Incorrect username or password.");
      return;
    }
    onSignedIn();
  };

  const inputStyle = {
    width: "100%", border: "none", borderRadius: 12, padding: "12px 14px", fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.field, color: T.ink, boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.ink,
      background: `radial-gradient(140% 60% at 10% -10%, #23243A 0%, ${T.paper} 40%, ${T.paperDeep} 100%)`,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        html, body { margin: 0; padding: 0; background: ${T.paperDeep}; }
        input:focus { outline: 2px solid ${T.accentTo}66; }
      `}</style>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, background: T.card, borderRadius: 22, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, background: ACCENT_GRADIENT, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Boxes size={18} color="#1A0F0A" />
          </div>
          <span style={{ fontSize: 19, fontWeight: 800 }}>Set Dressing</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.inkSoft, marginBottom: 6, display: "block" }}>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoCapitalize="none" autoCorrect="off" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.inkSoft, marginBottom: 6, display: "block" }}>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        </div>

        {error && <div style={{ color: T.danger, fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

        <button type="submit" disabled={submitting} style={{
          width: "100%", background: ACCENT_GRADIENT, color: "#1A0F0A", border: "none", borderRadius: 999,
          padding: "12px 18px", cursor: submitting ? "default" : "pointer", fontSize: 14, fontWeight: 800,
          opacity: submitting ? 0.7 : 1,
        }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function ModelingLibraryApp() {
  const [session, setSession] = useState(undefined); // undefined = still checking, null = signed out
  const [items, setItems] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [organizeKey, setOrganizeKey] = useState("all");
  const [specificValue, setSpecificValue] = useState("");
  const [search, setSearch] = useState("");
  const [openItemId, setOpenItemId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [customTypes, setCustomTypes] = useState([]);
  const [sectionNotes, setSectionNotes] = useState({});
  const [editingNoteFor, setEditingNoteFor] = useState("");
  const [categoryNotes, setCategoryNotes] = useState({});
  const [editingCategoryNoteFor, setEditingCategoryNoteFor] = useState("");

  // Auth: check for an existing session, and keep it in sync if it changes.
  useEffect(() => {
    if (supabaseConfigError) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) supabase.realtime.setAuth(newSession.access_token);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const role = session ? roleForEmail(session.user.email) : null;
  const isAdmin = role === "admin";

  // Initial load — fetch everything except photos first, so the list renders
  // and becomes interactive right away. Photos fill in shortly after, in the
  // background. Admin sessions also kick off a background reconciliation
  // pass (see runReconciliation below) that patches things up quietly
  // without ever replacing the whole list — that's what previously caused
  // a just-added photo to vanish if you kept working while it ran.
  useEffect(() => {
    if (supabaseConfigError) {
      setSyncError(supabaseConfigError);
      setItems(buildSeedItems());
      setLoaded(true);
      return;
    }
    if (!session) return; // wait until signed in
    (async () => {
      try {
        const metaData = await withTimeout(fetchAllItemsMeta(), 15000, "Loading the item list");

        if ((!metaData || metaData.length === 0) && isAdmin) {
          const seed = buildSeedItems();
          setItems(seed);
          const rows = seed.map(itemToRow);
          const chunkSize = 500;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const { error: insertError } = await supabase.from("items").insert(rows.slice(i, i + chunkSize));
            if (insertError) throw insertError;
          }
          setLoaded(true);
          await supabase.from("app_settings").upsert({ key: "reconciliation_version", value: RECONCILIATION_VERSION });
          return;
        }

        setItems(metaData.map((row) => ({ ...rowToItem(row), photo: null })));
        setLoaded(true);
        loadPhotosInBackground(); // fire-and-forget — fills photos in as they arrive
        // Give the page a moment to actually finish rendering and become
        // interactive before background cleanup starts competing for the
        // main thread with its own (heavier) fetch and image processing.
        if (isAdmin) setTimeout(() => runReconciliation(metaData), 2000);
      } catch (e) {
        console.error("Supabase load failed:", e);
        setSyncError(`Couldn't load the library (${e.message || "unknown error"}) — showing a local, unsaved copy instead. Try reloading.`);
        setItems(buildSeedItems());
        setLoaded(true);
      }
    })();
  }, [session]);

  // Fills row thumbnails in after the fast metadata-only load — small,
  // compressed images, not the full-quality photos (those load on-demand
  // only when an item is actually opened — see fetchItemPhoto).
  const loadPhotosInBackground = useCallback(async () => {
    try {
      const thumbs = await fetchAllThumbnails();
      const thumbMap = new Map(thumbs.map((t) => [t.id, t.thumbnail]));
      setItems((prev) => prev.map((i) => (thumbMap.has(i.id) ? { ...i, thumbnail: thumbMap.get(i.id) ?? null } : i)));
    } catch (e) {
      console.error("Background thumbnail load failed:", e);
    }
  }, []);

  // When an item is opened, load its full-quality photo on demand if we
  // don't already have it — the bulk background load only ever fetches
  // small thumbnails, never every full photo in the library.
  const ensureFullPhotoLoaded = useCallback(async (item) => {
    if (!item || item.photo) return; // already have it, or already tried
    const photo = await fetchItemPhoto(item.id);
    if (photo) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, photo } : i)));
  }, []);

  // Background cleanup — only actually does work if the database hasn't
  // already been reconciled at the current version (a flag in app_settings),
  // so on every normal day-to-day load this is a single cheap check and
  // nothing more. Every update below is targeted (add these specific rows,
  // remove these specific ids, patch these specific fields) — never a
  // wholesale replace of the item list, so it can never clobber something
  // you're actively editing while it runs.
  const runReconciliation = useCallback(async (data) => {
    try {
      const { data: versionRow } = await supabase.from("app_settings").select("value").eq("key", "reconciliation_version").maybeSingle();
      if (versionRow && versionRow.value === RECONCILIATION_VERSION) return; // already clean — nothing to do

      // Remove retired item types that may exist from an earlier seed.
      const retired = data.filter((row) => row.type === "Kitchen Island");
      if (retired.length > 0) {
        const retiredIds = retired.map((r) => r.id);
        const { error } = await supabase.from("items").delete().in("id", retiredIds);
        if (!error) setItems((prev) => prev.filter((i) => !retiredIds.includes(i.id)));
      }
      const cleanedData = data.filter((row) => row.type !== "Kitchen Island");

      // Backfill any category that's entirely missing.
      const seed = buildSeedItems();
      const presentTypes = new Set(cleanedData.map((row) => row.type));
      const missing = seed.filter((item) => !presentTypes.has(item.type));
      if (missing.length > 0) {
        const rows = missing.map(itemToRow);
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await supabase.from("items").insert(rows.slice(i, i + 500));
          if (error) console.error("Backfill insert failed:", error);
        }
        setItems((prev) => [...prev, ...missing]);
      }
      const fullData = [...cleanedData, ...missing.map(itemToRow)];

      // Clean up duplicates from an earlier bug where a truncated read caused
      // this same step to repeatedly re-insert items it thought were missing.
      const seenKeys = new Map();
      const duplicateIds = [];
      for (const row of [...fullData].sort((a, b) => (a.created_at || 0) - (b.created_at || 0))) {
        const key = `${row.name}|${row.type}|${row.style}`;
        if (seenKeys.has(key)) {
          const keptId = seenKeys.get(key);
          const kept = fullData.find((r) => r.id === keptId);
          if (kept && kept.status === "not-started" && row.status !== "not-started") {
            seenKeys.set(key, row.id);
            duplicateIds.push(keptId);
          } else {
            duplicateIds.push(row.id);
          }
        } else {
          seenKeys.set(key, row.id);
        }
      }
      if (duplicateIds.length > 0) {
        let removed = 0;
        for (let i = 0; i < duplicateIds.length; i += 150) {
          const chunk = duplicateIds.slice(i, i + 150);
          const { error } = await supabase.from("items").delete().in("id", chunk);
          if (!error) {
            removed += chunk.length;
            setItems((prev) => prev.filter((i) => !chunk.includes(i.id)));
          }
        }
        if (removed < duplicateIds.length) {
          setSyncError(`Cleaned up ${removed} duplicate items, but ${duplicateIds.length - removed} couldn't be removed.`);
        }
      }

      // Give any item that's never had a custom position a baseline order.
      const stillMissingOrder = fullData.filter((row) => row.sort_order == null && !duplicateIds.includes(row.id));
      if (stillMissingOrder.length > 0) {
        const alphabetical = [...stillMissingOrder].sort((a, b) => a.name.localeCompare(b.name));
        const orderUpdates = alphabetical.map((row, idx) => ({ id: row.id, sort_order: idx }));
        for (let i = 0; i < orderUpdates.length; i += 150) {
          const chunk = orderUpdates.slice(i, i + 150);
          await Promise.all(chunk.map((u) => supabase.from("items").update({ sort_order: u.sort_order }).eq("id", u.id)));
        }
        const orderMap = new Map(orderUpdates.map((u) => [u.id, u.sort_order]));
        setItems((prev) => prev.map((i) => (orderMap.has(i.id) ? { ...i, sortOrder: orderMap.get(i.id) } : i)));
      }

      // Shrink any already-stored photo that's still oversized from before the
      // upload cap existed — this is what actually keeps every page load fast
      // long-term, not just capping new uploads going forward. Fetched
      // separately here since the fast metadata-only load no longer carries
      // photo data at all.
      const validIds = new Set(fullData.filter((row) => !duplicateIds.includes(row.id)).map((row) => row.id));
      const allPhotos = await fetchAllPhotos();
      const oversizedPhotos = allPhotos.filter((row) => row.photo && row.photo.length > 350000 && validIds.has(row.id));
      if (oversizedPhotos.length > 0) {
        console.log(`Shrinking ${oversizedPhotos.length} oversized photo(s)…`);
        const batchSize = 4; // a few at a time — decoding/re-encoding images isn't free
        for (let i = 0; i < oversizedPhotos.length; i += batchSize) {
          const batch = oversizedPhotos.slice(i, i + batchSize);
          await Promise.all(batch.map(async (row) => {
            const shrunk = await shrinkPhotoIfOversized(row.photo);
            if (shrunk) {
              const { error } = await supabase.from("items").update({ photo: shrunk }).eq("id", row.id);
              if (!error) setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, photo: shrunk } : i)));
            }
          }));
          await new Promise((r) => setTimeout(r, 40)); // yield to the main thread between batches
        }
        console.log("Finished shrinking oversized photos.");
      }

      // Generate a small thumbnail for any item that has a full photo but no
      // thumbnail yet — that's what makes row previews fast, since the list
      // only ever loads thumbnails in bulk, never full photos.
      const missingThumbs = allPhotos.filter((row) => row.photo && !row.thumbnail && validIds.has(row.id));
      if (missingThumbs.length > 0) {
        console.log(`Generating ${missingThumbs.length} thumbnail(s)…`);
        const batchSize = 6;
        for (let i = 0; i < missingThumbs.length; i += batchSize) {
          const batch = missingThumbs.slice(i, i + batchSize);
          await Promise.all(batch.map(async (row) => {
            try {
              const thumbnail = await dataUrlToThumbnail(row.photo);
              const { error } = await supabase.from("items").update({ thumbnail }).eq("id", row.id);
              if (!error) setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, thumbnail } : i)));
            } catch (e) {
              console.error("Thumbnail generation failed for", row.id, e);
            }
          }));
          await new Promise((r) => setTimeout(r, 40)); // yield to the main thread between batches
        }
        console.log("Finished generating thumbnails.");
      }

      await supabase.from("app_settings").upsert({ key: "reconciliation_version", value: RECONCILIATION_VERSION });
    } catch (e) {
      console.error("Background reconciliation failed:", e);
    }
  }, []);

  // Live sync — when anyone on any account changes an item, everyone else sees it immediately.
  // If the realtime connection can't be established, this gives up after one
  // failure instead of retrying forever — the app still works fully without
  // it, just without instant cross-account updates (a page reload picks up
  // the latest data regardless).
  useEffect(() => {
    if (supabaseConfigError || !session) return;
    const channel = supabase
      .channel("items-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, (payload) => {
        setItems((prev) => {
          if (!prev) return prev;
          if (payload.eventType === "DELETE") {
            return prev.filter((i) => i.id !== payload.old.id);
          }
          const incoming = rowToItem(payload.new);
          const exists = prev.some((i) => i.id === incoming.id);
          return exists ? prev.map((i) => (i.id === incoming.id ? incoming : i)) : [incoming, ...prev];
        });
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Realtime (items) couldn't connect (${status}) — live sync is off for this session; reload to see others' changes.`);
          supabase.removeChannel(channel);
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  // Load admin-added categories and notes (both whole-section and per-subcategory), and keep them synced live.
  useEffect(() => {
    if (supabaseConfigError || !session) return;
    (async () => {
      const { data: types } = await supabase.from("custom_types").select("*");
      if (types) setCustomTypes(types);
      const { data: settings } = await supabase.from("app_settings").select("*");
      if (settings) {
        const notes = {};
        const catNotes = {};
        for (const row of settings) {
          if (row.key.startsWith("catnote_")) catNotes[row.key.slice("catnote_".length)] = row.value || "";
          else if (row.key.startsWith("note_")) notes[row.key.slice("note_".length)] = row.value || "";
        }
        setSectionNotes(notes);
        setCategoryNotes(catNotes);
      }
    })();

    const typesChannel = supabase
      .channel("custom-types-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_types" }, (payload) => {
        setCustomTypes((prev) => {
          if (payload.eventType === "DELETE") return prev.filter((c) => c.id !== payload.old.id);
          const exists = prev.some((c) => c.id === payload.new.id);
          return exists ? prev.map((c) => (c.id === payload.new.id ? payload.new : c)) : [...prev, payload.new];
        });
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Realtime (custom_types) couldn't connect (${status}) — giving up instead of retrying forever.`);
          supabase.removeChannel(typesChannel);
        }
      });

    const settingsChannel = supabase
      .channel("app-settings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, (payload) => {
        const row = payload.new;
        if (!row || !row.key) return;
        if (row.key.startsWith("catnote_")) {
          setCategoryNotes((prev) => ({ ...prev, [row.key.slice("catnote_".length)]: row.value || "" }));
        } else if (row.key.startsWith("note_")) {
          setSectionNotes((prev) => ({ ...prev, [row.key.slice("note_".length)]: row.value || "" }));
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Realtime (app_settings) couldn't connect (${status}) — giving up instead of retrying forever.`);
          supabase.removeChannel(settingsChannel);
        }
      });

    return () => { supabase.removeChannel(typesChannel); supabase.removeChannel(settingsChannel); };
  }, [session]);

  const addCategory = useCallback(async (groupKey, name) => {
    const groupNameMap = { furniture: "Furniture", decor: "Decor", kitchen: "Kitchen", room: "Room", style: "Style" };
    const groupName = groupNameMap[groupKey] || "Furniture";
    const newType = { id: uid("cat"), name: name.trim(), group_name: groupName, default_room: groupName === "Kitchen" ? "Kitchen" : "Living Room", created_at: Date.now() };
    setCustomTypes((prev) => [...prev, newType]);
    const { error } = await supabase.from("custom_types").insert([newType]);
    if (error) {
      console.error("Add category failed:", error);
      setCustomTypes((prev) => prev.filter((c) => c.id !== newType.id));
      setSyncError(`That category didn't save: ${error.message || "unknown error"}`);
    }
  }, []);

  const saveNote = useCallback(async (sectionKey, text) => {
    let previousValue;
    setSectionNotes((prev) => {
      previousValue = prev[sectionKey];
      return { ...prev, [sectionKey]: text };
    });
    const { error } = await supabase.from("app_settings").upsert({ key: `note_${sectionKey}`, value: text });
    if (error) {
      console.error("Save note failed:", error);
      setSectionNotes((prev) => ({ ...prev, [sectionKey]: previousValue }));
      setSyncError(`That note didn't save: ${error.message || "unknown error"}`);
      return false;
    }
    return true;
  }, []);

  const saveCategoryNote = useCallback(async (categoryValue, text) => {
    let previousValue;
    setCategoryNotes((prev) => {
      previousValue = prev[categoryValue];
      return { ...prev, [categoryValue]: text };
    });
    const { error } = await supabase.from("app_settings").upsert({ key: `catnote_${categoryValue}`, value: text });
    if (error) {
      console.error("Save category note failed:", error);
      setCategoryNotes((prev) => ({ ...prev, [categoryValue]: previousValue }));
      setSyncError(`That note didn't save: ${error.message || "unknown error"}`);
      return false;
    }
    return true;
  }, []);

  const setStatus = useCallback(async (id, status) => {
    const updatedAt = Date.now();
    let previous;
    setItems((prev) => {
      previous = prev;
      return prev.map((i) => (i.id === id ? { ...i, status, updatedAt } : i));
    });
    const { error } = await supabase.from("items").update({ status, updated_at: updatedAt }).eq("id", id);
    if (error) {
      console.error("Status update failed:", error);
      setItems(previous); // the write didn't actually happen — don't leave the UI showing otherwise
      setSyncError("That status change didn't save — please try again.");
    }
  }, []);

  const saveItem = useCallback(async (updated) => {
    const withTimestamp = { ...updated, updatedAt: Date.now() };
    let previous;
    setItems((prev) => {
      previous = prev;
      return prev.map((i) => (i.id === updated.id ? withTimestamp : i));
    });
    setOpenItemId(null);
    const { error } = await supabase.from("items").update(itemToRow(withTimestamp)).eq("id", updated.id);
    if (error) {
      console.error("Save failed:", error);
      setItems(previous);
      setSyncError("That save didn't go through — please reopen the item and try again.");
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    let previous;
    setItems((prev) => {
      previous = prev;
      return prev.filter((i) => i.id !== id);
    });
    setOpenItemId(null);
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      console.error("Delete failed:", error);
      setItems(previous);
      setSyncError("That delete didn't go through — please try again.");
    }
  }, []);

  // Drag-to-reorder — admin only. Reordering is scoped to whatever group the
  // items are being dragged within (e.g. within "Beds"); the underlying
  // sort_order values only matter relative to items sharing the same group.
  const reorderWithinGroup = useCallback(async (groupItems, draggedId, targetId) => {
    if (draggedId === targetId) return;
    const fromIndex = groupItems.findIndex((i) => i.id === draggedId);
    const toIndex = groupItems.findIndex((i) => i.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...groupItems];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updates = reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }));
    let previous;
    setItems((prev) => {
      previous = prev;
      const orderMap = new Map(updates.map((u) => [u.id, u.sortOrder]));
      return prev.map((i) => (orderMap.has(i.id) ? { ...i, sortOrder: orderMap.get(i.id) } : i));
    });

    const results = await Promise.all(updates.map((u) => supabase.from("items").update({ sort_order: u.sortOrder }).eq("id", u.id)));
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error("Reorder failed:", failed.error);
      setItems(previous);
      setSyncError("That reorder didn't save — please try again.");
    }
  }, []);

  const createItem = useCallback(async (item) => {
    setItems((prev) => [item, ...prev]);
    setShowAdd(false);
    const { error } = await supabase.from("items").insert([itemToRow(item)]);
    if (error) console.error("Create failed:", error);
  }, []);

  const furnitureTypes = useMemo(() => [...FURNITURE_TYPES, ...customTypes.filter((c) => c.group_name === "Furniture").map((c) => c.name)], [customTypes]);
  const decorTypes = useMemo(() => [...DECOR_TYPES, ...customTypes.filter((c) => c.group_name === "Decor").map((c) => c.name)], [customTypes]);
  const kitchenTypes = useMemo(() => [...KITCHEN_TYPES, ...customTypes.filter((c) => c.group_name === "Kitchen").map((c) => c.name)], [customTypes]);
  const rooms = useMemo(() => [...ROOMS, ...customTypes.filter((c) => c.group_name === "Room").map((c) => c.name)], [customTypes]);
  const styles = useMemo(() => [...STYLE_NAMES, ...customTypes.filter((c) => c.group_name === "Style").map((c) => c.name)], [customTypes]);
  const allTypeNames = useMemo(() => [...TYPE_NAMES, ...customTypes.filter((c) => ["Furniture", "Decor", "Kitchen"].includes(c.group_name)).map((c) => c.name)], [customTypes]);

  const organizeOptions = useMemo(() => [
    { key: "all", label: "All Items", values: allTypeNames, field: "type" },
    { key: "furniture", label: "Furniture", values: furnitureTypes, field: "type" },
    { key: "decor", label: "Decor", values: decorTypes, field: "type" },
    { key: "kitchen", label: "Kitchen System", values: kitchenTypes, field: "type" },
    { key: "room", label: "Room", values: rooms, field: "room" },
    { key: "style", label: "Style", values: styles, field: "style" },
  ], [allTypeNames, furnitureTypes, decorTypes, kitchenTypes, rooms, styles]);

  const organizeMode = organizeOptions.find((o) => o.key === organizeKey);

  const filtered = useMemo(() => {
    if (!items) return [];
    let res = items;
    const s = search.trim().toLowerCase();
    if (s) res = res.filter((i) => [i.name, i.type, i.room, i.style].join(" ").toLowerCase().includes(s));
    if (specificValue) {
      res = res.filter((i) => i[organizeMode.field] === specificValue);
    } else if (organizeKey === "furniture") {
      res = res.filter((i) => i.typeGroup === "Furniture");
    } else if (organizeKey === "decor") {
      res = res.filter((i) => i.typeGroup === "Decor" || i.typeGroup === "Misc");
    } else if (organizeKey === "kitchen") {
      res = res.filter((i) => i.typeGroup === "Kitchen");
    }
    return res;
  }, [items, search, specificValue, organizeMode, organizeKey]);

  const groups = useMemo(() => {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const byOrder = (a, b) => {
      const ao = a.sortOrder, bo = b.sortOrder;
      if (ao == null && bo == null) return byName(a, b);
      if (ao == null) return 1;
      if (bo == null) return -1;
      return ao - bo || byName(a, b);
    };
    if (specificValue) return [{ key: specificValue, items: [...filtered].sort(byOrder) }];
    const map = new Map();
    for (const item of filtered) {
      const k = item[organizeMode.field];
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    }
    return organizeMode.values
      .filter((v) => map.has(v))
      .map((v) => ({ key: v, items: map.get(v).sort(byOrder) }));
  }, [filtered, specificValue, organizeMode]);

  const openItem = items && openItemId ? items.find((i) => i.id === openItemId) : null;

  useEffect(() => {
    if (openItemId) ensureFullPhotoLoaded(items?.find((i) => i.id === openItemId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItemId]);

  if (session === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.inkSoft, background: T.paperDeep }}>
        <Loader2 className="spin" size={18} style={{ marginRight: 8 }} /> Loading…
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onSignedIn={() => {}} />;
  }

  if (!items) {
    return (
      <div className="sd-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.inkSoft, background: T.paperDeep }}>
        <Loader2 className="spin" size={18} style={{ marginRight: 8 }} /> Loading library…
      </div>
    );
  }

  return (
    <div className="sd-app" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.ink,
      background: `radial-gradient(140% 60% at 10% -10%, #23243A 0%, ${T.paper} 40%, ${T.paperDeep} 100%)`,
      width: "100%", boxSizing: "border-box", minHeight: "100vh",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        html, body { margin: 0; padding: 0; background: ${T.paperDeep}; min-height: 100%; }
        * { box-sizing: border-box; }
        input, select, textarea, button { font-family: inherit; }
        input:focus, select:focus { outline: 2px solid ${T.accentTo}66; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sd-row-main { display: flex; align-items: center; gap: 14px; flex: 1 1 220px; min-width: 0; }
        select { -webkit-appearance: none; appearance: none; }

        .sd-app-inner { max-width: 1320px; margin: 0 auto; }

        /* ---------- Large desktop ---------- */
        @media (min-width: 1200px) {
          .sd-app-inner { padding: 32px 48px; }
          .sd-row { padding: 16px !important; }
          .sd-row-photo { width: 108px !important; height: 108px !important; }
          .sd-row-name { font-size: 18px !important; }
        }

        /* ---------- Tablet & below ---------- */
        @media (max-width: 720px) {
          .sd-app-inner { padding: 16px !important; }
          .sd-modal-grid { grid-template-columns: 1fr !important; }
        }

        /* ---------- Phones ---------- */
        @media (max-width: 520px) {
          .sd-app-inner { padding: 14px !important; }
          .sd-header { gap: 12px !important; }
          .sd-header-brand span { font-size: 17px !important; }
          .sd-add-btn { width: 100% !important; padding: 12px 16px !important; }
          .sd-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .sd-search-wrap { width: 100% !important; flex: 1 1 auto !important; }
          .sd-sortmenu { width: 100% !important; }
          .sd-sortmenu-btn { max-width: none !important; width: 100% !important; }
          /* Anchored to the viewport (not the button) so it's always fully reachable
             and independently scrollable, no matter where the page has scrolled to. */
          .sd-sortmenu-panel {
            position: fixed !important; top: 88px !important; left: 12px !important; right: 12px !important;
            bottom: 12px !important; width: auto !important; max-height: none !important;
            overflow-y: auto !important; -webkit-overflow-scrolling: touch !important;
          }
          .sd-group-header { flex-wrap: wrap !important; }
          .sd-row { padding: 10px !important; gap: 10px !important; }
          .sd-row-photo { width: 64px !important; height: 64px !important; }
          .sd-row-name { font-size: 15.5px !important; }
          .sd-row-status { width: 100% !important; margin-left: 0 !important; }
          .sd-modal { padding: 18px !important; max-width: 100% !important; border-radius: 20px !important; }
          .sd-modal-overlay {
            padding: 0 !important; align-items: flex-start !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .sd-modal-overlay > div { border-radius: 0 !important; min-height: 100% !important; margin: 0 !important; }
          .sd-modal-actions { flex-wrap: wrap !important; }
          .sd-modal-actions > div { width: 100% !important; justify-content: stretch !important; }
          .sd-modal-actions button { flex: 1 1 auto !important; }
        }
      `}</style>

      <div className="sd-app-inner" style={{ padding: "22px 26px" }}>
        {syncError && (
          <div style={{
            background: "rgba(255,107,107,0.14)", border: "1px solid rgba(255,107,107,0.4)", color: "#FFB4B4",
            borderRadius: 12, padding: "10px 14px", fontSize: 12.5, fontWeight: 600, marginBottom: 14,
          }}>
            {syncError}
          </div>
        )}
        <div className="sd-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div className="sd-header-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11, background: ACCENT_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 6px 16px ${T.accentTo}55`, flexShrink: 0,
            }}>
              <Boxes size={17} color="#1A0F0A" />
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 19, color: T.ink, letterSpacing: -0.2 }}>Set Dressing</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isAdmin && (
              <button className="sd-add-btn" onClick={() => setShowAdd(true)} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: ACCENT_GRADIENT, color: "#1A0F0A", border: "none",
                borderRadius: 999, padding: "11px 22px", cursor: "pointer", fontSize: 13.5, fontWeight: 800,
                boxShadow: `0 6px 18px ${T.accentTo}4D`,
                transition: "box-shadow .2s ease, transform .15s ease",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 24px ${T.accentTo}66`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 6px 18px ${T.accentTo}4D`; e.currentTarget.style.transform = "none"; }}
              >
                <Plus size={15} /> Add Item
              </button>
            )}
            <button onClick={() => signOut()} style={{
              background: T.cardAlt, color: T.inkSoft, border: "none", borderRadius: 999,
              padding: "11px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>
              Log out
            </button>
          </div>
        </div>

        <div className="sd-toolbar" style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div className="sd-search-wrap" style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
            <Search size={15} color={T.inkSoft} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 999, border: "none", background: T.card, color: T.ink, fontSize: 13.5, boxSizing: "border-box", minHeight: 42, boxShadow: "0 2px 10px rgba(0,0,0,0.22)" }} />
          </div>

          <SortMenu organizeKey={organizeKey} specificValue={specificValue} onPick={(key, val) => { setOrganizeKey(key); setSpecificValue(val); }}
            organizeOptions={organizeOptions} isAdmin={isAdmin} onAddCategory={addCategory} />

          {specificValue && (
            <button onClick={() => setSpecificValue("")} style={{ fontSize: 12.5, color: T.inkSoft, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "6px 2px", minHeight: 32, fontWeight: 600 }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        <NoteBlock
          value={sectionNotes[organizeKey]}
          isAdmin={isAdmin}
          editing={editingNoteFor === organizeKey}
          onStartEdit={() => setEditingNoteFor(organizeKey)}
          onCancelEdit={() => setEditingNoteFor("")}
          onSave={(text) => saveNote(organizeKey, text)}
          label={organizeMode.label}
        />

        {specificValue && (
          <NoteBlock
            value={categoryNotes[specificValue]}
            isAdmin={isAdmin}
            editing={editingCategoryNoteFor === specificValue}
            onStartEdit={() => setEditingCategoryNoteFor(specificValue)}
            onCancelEdit={() => setEditingCategoryNoteFor("")}
            onSave={(text) => saveCategoryNote(specificValue, text)}
            label={specificValue}
          />
        )}

        <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14, fontWeight: 600 }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>

        {groups.map((g) => {
          const isCollapsed = !specificValue && !search.trim() && !expanded.has(g.key);
          const doneCount = g.items.filter((i) => i.status === "complete").length;
          return (
            <div key={g.key} style={{ marginBottom: 8 }}>
              {!specificValue && (
                <>
                  <button className="sd-group-header" onClick={() => setExpanded((prev) => { const next = new Set(prev); next.has(g.key) ? next.delete(g.key) : next.add(g.key); return next; })}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 2px", textAlign: "left" }}>
                    {isCollapsed ? <ChevronRight size={15} color={T.inkSoft} /> : <ChevronDown size={15} color={T.inkSoft} />}
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: T.ink }}>{g.key}</span>
                    <span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>{doneCount}/{g.items.length} done</span>
                  </button>
                  {!isCollapsed && (
                    <NoteBlock
                      compact
                      value={categoryNotes[g.key]}
                      isAdmin={isAdmin}
                      editing={editingCategoryNoteFor === g.key}
                      onStartEdit={() => setEditingCategoryNoteFor(g.key)}
                      onCancelEdit={() => setEditingCategoryNoteFor("")}
                      onSave={(text) => saveCategoryNote(g.key, text)}
                      label={g.key}
                    />
                  )}
                </>
              )}
              {!isCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  {g.items.map((item) => (
                    isAdmin ? (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => { setDraggedItemId(item.id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); if (draggedItemId) reorderWithinGroup(g.items, draggedItemId, item.id); setDraggedItemId(null); }}
                        onDragEnd={() => setDraggedItemId(null)}
                        style={{ display: "flex", alignItems: "center", gap: 4, opacity: draggedItemId === item.id ? 0.4 : 1 }}
                      >
                        <GripVertical size={16} color={T.inkSoft} style={{ flexShrink: 0, cursor: "grab" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <ItemRow item={item} onOpen={setOpenItemId} onStatusChange={setStatus} />
                        </div>
                      </div>
                    ) : (
                      <ItemRow key={item.id} item={item} onOpen={setOpenItemId} onStatusChange={setStatus} />
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.inkSoft }}>
            <Boxes size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nothing matches yet.</div>
          </div>
        )}
      </div>

      {openItem && <ItemModal item={openItem} isAdmin={isAdmin} onClose={() => setOpenItemId(null)} onSave={saveItem} onStatusChange={setStatus} onDelete={deleteItem}
        furnitureTypes={furnitureTypes} decorTypes={decorTypes} kitchenTypes={kitchenTypes} customTypes={customTypes} rooms={rooms} styles={styles} />}
      {isAdmin && showAdd && <AddItemModal onClose={() => setShowAdd(false)} onCreate={createItem}
        furnitureTypes={furnitureTypes} decorTypes={decorTypes} kitchenTypes={kitchenTypes} customTypes={customTypes} rooms={rooms} styles={styles} />}
    </div>
  );
}
