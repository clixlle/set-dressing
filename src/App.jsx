import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Plus, X, ChevronDown, ChevronRight, Trash2, Camera, Check, Clock, Circle, Boxes, Loader2, Download, Pencil, ClipboardPaste
} from "lucide-react";
import { supabase, rowToItem, itemToRow, supabaseConfigError } from "./supabaseClient";

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

function typeGroupFor(typeName) {
  const cat = CATEGORY_TYPES.find((c) => c.singular === typeName);
  if (cat) return cat.group;
  if (KIDS_FURNITURE.some((k) => k.name === typeName)) return "Furniture";
  if (typeName === "Plant") return "Decor";
  if (typeName === "Miscellaneous") return "Misc";
  if (KITCHEN_MODULE_TYPES.includes(typeName)) return "Kitchen";
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
function blobToPngDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
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
function PhotoField({ src, onUpload, onDelete, name }) {
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const [pasteError, setPasteError] = useState("");

  const handlePaste = async (e) => {
    const file = extractPastedImage(e.clipboardData);
    if (!file) return;
    e.preventDefault();
    const pngDataUrl = await blobToPngDataUrl(file);
    onUpload(pngDataUrl);
  };

  const pasteFromClipboard = async () => {
    setPasteError("");
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setPasteError("This browser doesn't support paste-from-clipboard here — use \"Add photo\" instead.");
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const pngDataUrl = await blobToPngDataUrl(blob);
          onUpload(pngDataUrl);
          return;
        }
      }
      setPasteError("No image found on your clipboard — copy an image first, then try again.");
    } catch (err) {
      setPasteError("Couldn't read the clipboard — your browser may need permission, or use \"Add photo\" instead.");
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
              const pngDataUrl = await blobToPngDataUrl(file);
              onUpload(pngDataUrl);
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
            <button onClick={() => downloadPhoto(src, name)} style={{
              display: "flex", alignItems: "center", gap: 6, background: T.cardAlt, color: T.ink, border: "none",
              borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 700,
            }}>
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
        <Photo className="sd-row-photo" src={item.photo} editable={false} size={92} />
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
function ItemModal({ item, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);
  const inputStyle = { width: "100%", border: "none", borderRadius: 12, padding: "11px 12px", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.field, color: T.ink, boxSizing: "border-box" };
  const labelStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: T.inkSoft, marginBottom: 7, display: "block" };

  return (
    <div className="sd-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(6,6,10,0.72)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }} onClick={onClose}>
      <div className="sd-modal" style={{ background: T.paperDeep, borderRadius: 26, maxWidth: 460, width: "100%", padding: 26, boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: T.ink }}>Edit item</span>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color={T.inkSoft} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Name</span>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Photo</span>
          <PhotoField src={draft.photo} name={draft.name} onUpload={(url) => setDraft({ ...draft, photo: url })} onDelete={() => setDraft({ ...draft, photo: null })} />
        </div>

        <div className="sd-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <span style={labelStyle}>Object type</span>
            <select value={draft.type} onChange={(e) => {
              setDraft({ ...draft, type: e.target.value, typeGroup: typeGroupFor(e.target.value) });
            }} style={inputStyle}>
              <optgroup label="Furniture">{FURNITURE_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
              <optgroup label="Decor">{DECOR_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
              <optgroup label="Kitchen System">{KITCHEN_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <span style={labelStyle}>Style</span>
            <select value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} style={inputStyle}>
              {STYLE_NAMES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Room</span>
            <select value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} style={inputStyle}>
              {ROOMS.map((r) => <option key={r}>{r}</option>)}
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

        <div style={{ marginBottom: 22 }}>
          <span style={labelStyle}>Status</span>
          <StatusPicker status={draft.status} onChange={(s) => setDraft({ ...draft, status: s })} width={200} />
        </div>

        <div className="sd-modal-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
          <button onClick={() => onDelete(draft.id)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5, fontWeight: 700, padding: "8px 4px", flexShrink: 0 }}>
            <Trash2 size={14} /> Delete
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ background: T.cardAlt, border: "none", borderRadius: 999, padding: "10px 18px", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: T.inkSoft, minHeight: 40 }}>Cancel</button>
            <button onClick={() => onSave({ ...draft, updatedAt: Date.now() })} style={{ background: ACCENT_GRADIENT, color: "#1A0F0A", border: "none", borderRadius: 999, padding: "10px 22px", cursor: "pointer", fontSize: 13.5, fontWeight: 800, minHeight: 40, boxShadow: `0 6px 20px ${T.accentTo}44` }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== ADD ITEM MODAL ============================== */
function AddItemModal({ onClose, onCreate }) {
  const [draft, setDraft] = useState({ name: "", type: TYPE_NAMES[0], typeGroup: CATEGORY_TYPES[0].group, room: ROOMS[0], style: STYLE_NAMES[0], status: "not-started", photo: null, description: "" });
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
          <PhotoField src={draft.photo} name={draft.name || suggestedName} onUpload={(url) => setDraft({ ...draft, photo: url })} onDelete={() => setDraft({ ...draft, photo: null })} />
        </div>

        <div className="sd-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          <div>
            <span style={labelStyle}>Object type</span>
            <select value={draft.type} onChange={(e) => {
              setDraft({ ...draft, type: e.target.value, typeGroup: typeGroupFor(e.target.value) });
            }} style={inputStyle}>
              <optgroup label="Furniture">{FURNITURE_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
              <optgroup label="Decor">{DECOR_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
              <optgroup label="Kitchen System">{KITCHEN_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
            </select>
          </div>
          <div>
            <span style={labelStyle}>Style</span>
            <select value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} style={inputStyle}>
              {STYLE_NAMES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Room</span>
            <select value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} style={inputStyle}>
              {ROOMS.map((r) => <option key={r}>{r}</option>)}
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
const ORGANIZE_OPTIONS = [
  { key: "all", label: "All Items", values: TYPE_NAMES, field: "type" },
  { key: "furniture", label: "Furniture", values: FURNITURE_TYPES, field: "type" },
  { key: "decor", label: "Decor", values: DECOR_TYPES, field: "type" },
  { key: "kitchen", label: "Kitchen System", values: KITCHEN_TYPES, field: "type" },
  { key: "room", label: "Room", values: ROOMS, field: "room" },
  { key: "style", label: "Style", values: STYLE_NAMES, field: "style" },
];

function SortMenu({ organizeKey, specificValue, onPick }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const activeMode = ORGANIZE_OPTIONS.find((o) => o.key === organizeKey);
  const currentLabel = specificValue ? specificValue : `All by ${activeMode.label}`;

  return (
    <div ref={ref} className="sd-sortmenu" style={{ position: "relative" }}>
      <button
        className="sd-sortmenu-btn"
        onClick={() => { setOpen((v) => !v); setExpanded(""); }}
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
          width: "min(280px, 82vw)",
          background: T.cardAlt, borderRadius: 18, boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          padding: 8, maxHeight: 360, overflowY: "auto",
        }}>
          {ORGANIZE_OPTIONS.map((o) => (
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModelingLibraryApp() {
  const [items, setItems] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [organizeKey, setOrganizeKey] = useState("all");
  const [specificValue, setSpecificValue] = useState("");
  const [search, setSearch] = useState("");
  const [openItemId, setOpenItemId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  // Initial load from Supabase — if the table is empty (first run ever), seed it once.
  // If it already has data, reconcile it: remove retired item types, and backfill any
  // whole category that's missing (e.g. a batch insert that failed partway through).
  useEffect(() => {
    if (supabaseConfigError) {
      setSyncError(supabaseConfigError);
      setItems(buildSeedItems());
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        let { data, error } = await supabase.from("items").select("*");
        if (error) throw error;

        if (!data || data.length === 0) {
          const seed = buildSeedItems();
          setItems(seed);
          const rows = seed.map(itemToRow);
          const chunkSize = 500;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const { error: insertError } = await supabase.from("items").insert(rows.slice(i, i + chunkSize));
            if (insertError) throw insertError;
          }
        } else {
          // Remove retired item types that may already exist from an earlier seed.
          const { error: delError } = await supabase.from("items").delete().eq("type", "Kitchen Island");
          if (delError) console.error("Cleanup delete failed:", delError);
          data = data.filter((row) => row.type !== "Kitchen Island");

          // Backfill any category that's entirely missing (e.g. an insert batch that
          // failed partway through when the table was first seeded).
          const seed = buildSeedItems();
          const presentTypes = new Set(data.map((row) => row.type));
          const missing = seed.filter((item) => !presentTypes.has(item.type));
          if (missing.length > 0) {
            const rows = missing.map(itemToRow);
            const chunkSize = 500;
            for (let i = 0; i < rows.length; i += chunkSize) {
              const { error: insertError } = await supabase.from("items").insert(rows.slice(i, i + chunkSize));
              if (insertError) console.error("Backfill insert failed:", insertError);
            }
            data = [...data, ...missing.map(itemToRow)];
          }

          setItems(data.map(rowToItem));
        }
      } catch (e) {
        console.error("Supabase load failed:", e);
        setSyncError("Couldn't connect to the database — showing a local, unsaved copy instead.");
        setItems(buildSeedItems());
      }
      setLoaded(true);
    })();
  }, []);

  // Live sync — when anyone on any account changes an item, everyone else sees it immediately.
  useEffect(() => {
    if (supabaseConfigError) return;
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const setStatus = useCallback(async (id, status) => {
    const updatedAt = Date.now();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, updatedAt } : i)));
    const { error } = await supabase.from("items").update({ status, updated_at: updatedAt }).eq("id", id);
    if (error) console.error("Status update failed:", error);
  }, []);

  const saveItem = useCallback(async (updated) => {
    const withTimestamp = { ...updated, updatedAt: Date.now() };
    setItems((prev) => prev.map((i) => (i.id === updated.id ? withTimestamp : i)));
    setOpenItemId(null);
    const { error } = await supabase.from("items").update(itemToRow(withTimestamp)).eq("id", updated.id);
    if (error) console.error("Save failed:", error);
  }, []);

  const deleteItem = useCallback(async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOpenItemId(null);
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) console.error("Delete failed:", error);
  }, []);

  const createItem = useCallback(async (item) => {
    setItems((prev) => [item, ...prev]);
    setShowAdd(false);
    const { error } = await supabase.from("items").insert([itemToRow(item)]);
    if (error) console.error("Create failed:", error);
  }, []);

  const organizeMode = ORGANIZE_OPTIONS.find((o) => o.key === organizeKey);

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
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (specificValue) return [{ key: specificValue, items: sorted }];
    const map = new Map();
    for (const item of sorted) {
      const k = item[organizeMode.field];
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    }
    return organizeMode.values
      .filter((v) => map.has(v))
      .map((v) => ({ key: v, items: map.get(v) }));
  }, [filtered, specificValue, organizeMode]);

  const openItem = items && openItemId ? items.find((i) => i.id === openItemId) : null;

  if (!items) {
    return (
      <div className="sd-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 420, fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.inkSoft }}>
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
        </div>

        <div className="sd-toolbar" style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div className="sd-search-wrap" style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
            <Search size={15} color={T.inkSoft} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 999, border: "none", background: T.card, color: T.ink, fontSize: 13.5, boxSizing: "border-box", minHeight: 42, boxShadow: "0 2px 10px rgba(0,0,0,0.22)" }} />
          </div>

          <SortMenu organizeKey={organizeKey} specificValue={specificValue} onPick={(key, val) => { setOrganizeKey(key); setSpecificValue(val); }} />

          {specificValue && (
            <button onClick={() => setSpecificValue("")} style={{ fontSize: 12.5, color: T.inkSoft, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "6px 2px", minHeight: 32, fontWeight: 600 }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {organizeKey === "kitchen" && (
          <div style={{
            background: T.cardAlt, borderLeft: `3px solid ${T.accentTo}`, borderRadius: 12,
            padding: "14px 16px", marginBottom: 16, fontSize: 13, lineHeight: 1.55, color: T.inkSoft,
          }}>
            <strong style={{ color: T.ink }}>All kitchen pieces must be designed as add-ons to the main base module.</strong> Variations
            such as cabinet doors, handles, countertops, shelves, and decorative elements should fit the base seamlessly
            without requiring modifications. All modules must share consistent dimensions, alignment, and connection
            points to ensure any combination of pieces can be mixed and matched together cleanly.
          </div>
        )}

        <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14, fontWeight: 600 }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>

        {groups.map((g) => {
          const isCollapsed = !specificValue && !search.trim() && !expanded.has(g.key);
          const doneCount = g.items.filter((i) => i.status === "complete").length;
          return (
            <div key={g.key} style={{ marginBottom: 8 }}>
              {!specificValue && (
                <button className="sd-group-header" onClick={() => setExpanded((prev) => { const next = new Set(prev); next.has(g.key) ? next.delete(g.key) : next.add(g.key); return next; })}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 2px", textAlign: "left" }}>
                  {isCollapsed ? <ChevronRight size={15} color={T.inkSoft} /> : <ChevronDown size={15} color={T.inkSoft} />}
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: T.ink }}>{g.key}</span>
                  <span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>{doneCount}/{g.items.length} done</span>
                </button>
              )}
              {!isCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  {g.items.map((item) => <ItemRow key={item.id} item={item} onOpen={setOpenItemId} onStatusChange={setStatus} />)}
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

      {openItem && <ItemModal item={openItem} onClose={() => setOpenItemId(null)} onSave={saveItem} onDelete={deleteItem} />}
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onCreate={createItem} />}
    </div>
  );
}
