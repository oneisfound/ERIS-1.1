import { useState, useMemo } from "react";
import {
  Star, Heart, Flame, Zap, Coffee, Book, BookOpen, Bookmark, Briefcase,
  Calendar, Camera, Car, Clock, Cloud, Code, Compass, CreditCard,
  Database, Diamond, Dumbbell, Feather, FileText, Film, Flag, Flower,
  Folder, Gift, Globe, GraduationCap, Hammer, Headphones, Home,
  Image as ImageIcon, Key, Laptop, Leaf, Lightbulb, Lock, Unlock,
  Map, MapPin, Medal, Mic, Moon, Mountain, Music, Package, Palette,
  Paperclip, Pencil, Phone, PiggyBank, Plane, Puzzle, Rocket, Ruler,
  School, Scissors, Settings, Shield, ShoppingBag, ShoppingCart, Smile,
  Snowflake, Sparkles, Sun, Sunrise, Sunset, Target, Tent, Ticket,
  Trash2, TreePine, Trophy, Umbrella, User, Users, Utensils, Video,
  Wallet, Watch, Wind, Wrench,
  Type, Heading1, Heading2, Heading3, Heading4, List, ListOrdered,
  CheckSquare, ChevronRight, ChevronDown, Quote, Minus, MessageSquare,
  Columns3, File as FileGeneric, X, Plus, ListTree,
  AlignLeft, AlignCenter, AlignRight, GripVertical,
  Copy, Maximize2, Minimize2,
  Table, LayoutGrid, Kanban, List as ListIcon,
  Tag, Hash, Link, Mail, PhoneCall,
  Check, MoreVertical, Search, CalendarDays,
  LayoutTemplate, Sigma,
  Upload, Download, FileCode, FileDown,
} from "lucide-react";

export const ICON_MAP = {
  Star, Heart, Flame, Zap, Coffee, Book, BookOpen, Bookmark, Briefcase,
  Calendar, Camera, Car, Clock, Cloud, Code, Compass, CreditCard,
  Database, Diamond, Dumbbell, Feather, FileText, Film, Flag, Flower,
  Folder, Gift, Globe, GraduationCap, Hammer, Headphones, Home,
  ImageIcon, Key, Laptop, Leaf, Lightbulb, Lock, Unlock,
  Map, MapPin, Medal, Mic, Moon, Mountain, Music, Package, Palette,
  Paperclip, Pencil, Phone, PiggyBank, Plane, Puzzle, Rocket, Ruler,
  School, Scissors, Settings, Shield, ShoppingBag, ShoppingCart, Smile,
  Snowflake, Sparkles, Sun, Sunrise, Sunset, Target, Tent, Ticket,
  Trash2, TreePine, Trophy, Umbrella, User, Users, Utensils, Video,
  Wallet, Watch, Wind, Wrench,
  Type, Heading1, Heading2, Heading3, Heading4, List, ListOrdered,
  CheckSquare, ChevronRight, ChevronDown, Quote, Minus, MessageSquare,
  Columns3, FileGeneric, X, Plus, ListTree,
  AlignLeft, AlignCenter, AlignRight, GripVertical,
  Copy, Maximize2, Minimize2,
  Table, LayoutGrid, Kanban, ListIcon,
  Tag, Hash, Link, Mail, PhoneCall,
  Check, MoreVertical, Search, CalendarDays,
  LayoutTemplate, Sigma,
  Upload, Download, FileCode, FileDown,
};

const ICON_NAMES = Object.keys(ICON_MAP);

const EMOJI_GROUPS = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤨","😐","😑","😶","🙄","😏","😒","😴","🥱","😪","😌","😎","🤓","🧐","🥳","😭","😢","😤","😡","🥵","🥶","😱","🤯","🥴","😇"],
  "Gestures & People": ["👋","🤚","🖐️","✋","🤙","💪","🙏","👍","👎","👏","🙌","🤝","✍️","👀","🧠","🦴","👤","🧑","👩","👨","🧑‍💻","🧑‍🎨","🧑‍🚀","🧑‍🏫","🧙","🦸"],
  "Nature & Animals": ["🐶","🐱","🦊","🐻","🐼","🐨","🐯","🦁","🐸","🐵","🦄","🐝","🦋","🐢","🐙","🦖","🌵","🌲","🌳","🍀","🌸","🌼","🌻","🌞","🌝","🌚","🌙","⭐","🌟","✨","⚡","🔥","💧","🌊","☁️","🌈","❄️"],
  "Food & Drink": ["🍎","🍊","🍋","🍉","🍇","🍓","🍒","🍍","🥭","🍆","🥑","🌽","🍕","🍔","🌭","🥪","🌮","🍜","🍣","🍩","🍪","🎂","🍰","🍫","🍬","🍭","☕","🍵","🥤","🍷","🍺"],
  "Activities & Objects": ["⚽","🏀","🏈","⚾","🎾","🏐","🎱","🎮","🎲","🎯","🎨","🎬","🎵","🎧","🎸","📷","📚","📖","✏️","📝","💡","🔑","🔒","🔓","💻","📱","⌚","🎁","🛒","💰","💎","🏆","🚀","✈️","🚗","⛵","🏠","🏝️","🗺️","🧭","⏰","📅","📌","📎","🔖","🗂️","📁","📊","📈","🔗","⚙️","🔨","🧪","🔬","🔭"],
  "Symbols": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💯","✅","❌","❗","❓","⭐","🔴","🟠","🟡","🟢","🔵","🟣","⚪","⚫","🔺","🔶","🔷","♻️","💠","🔔","🚩"],
};

export default function IconEmojiPicker({ colors, currentIcon, onSelect, onClose }) {
  const [tab, setTab] = useState("emoji"); // "emoji" | "icon"
  const [query, setQuery] = useState("");

  const filteredIcons = useMemo(() => {
    if (!query.trim()) return ICON_NAMES;
    const q = query.trim().toLowerCase();
    return ICON_NAMES.filter(n => n.toLowerCase().includes(q));
  }, [query]);

  return (
    <div
      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
      onMouseDown={e => e.stopPropagation()}
      style={{
        background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8,
        width: 280, boxShadow: "0 4px 14px rgba(0,0,0,0.15)", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => setTab("emoji")}
          style={{
            flex: 1, padding: "8px 0", fontSize: 12, cursor: "pointer", border: "none",
            background: tab === "emoji" ? colors.surface : "transparent",
            color: tab === "emoji" ? colors.text : colors.muted, fontWeight: tab === "emoji" ? 600 : 400,
          }}
        >
          Emoji
        </button>
        <button
          onClick={() => setTab("icon")}
          style={{
            flex: 1, padding: "8px 0", fontSize: 12, cursor: "pointer", border: "none",
            background: tab === "icon" ? colors.surface : "transparent",
            color: tab === "icon" ? colors.text : colors.muted, fontWeight: tab === "icon" ? 600 : 400,
          }}
        >
          Icon
        </button>
        <button
          onClick={() => { onSelect(null); onClose(); }}
          title="Reset to default"
          style={{
            padding: "0 10px", fontSize: 11, cursor: "pointer", border: "none",
            background: "transparent", color: colors.muted,
          }}
        >
          Reset
        </button>
      </div>

      {tab === "icon" && (
        <div style={{ padding: "8px 10px 0" }}>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search icons…"
            style={{
              width: "100%", border: `1px solid ${colors.border}`, borderRadius: 5,
              padding: "6px 8px", fontSize: 12, outline: "none",
              background: colors.surface, color: colors.text, fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={{ maxHeight: 220, overflowY: "auto", padding: 10 }}>
        {tab === "emoji" ? (
          Object.entries(EMOJI_GROUPS).map(([groupName, emojis]) => (
            <div key={groupName} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: colors.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {groupName}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
                {emojis.map(em => (
                  <button
                    key={em}
                    onClick={() => { onSelect({ type: "emoji", value: em }); onClose(); }}
                    style={{
                      background: currentIcon?.value === em ? colors.surface : "transparent",
                      border: "none", borderRadius: 5, cursor: "pointer",
                      fontSize: 18, padding: 4, lineHeight: 1,
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
            {filteredIcons.map(name => {
              const IconComp = ICON_MAP[name];
              const active = currentIcon?.type === "icon" && currentIcon.value === name;
              return (
                <button
                  key={name}
                  title={name}
                  onClick={() => { onSelect({ type: "icon", value: name }); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active ? colors.surface : "transparent",
                    border: active ? "1.5px solid #2383e2" : "1px solid transparent",
                    borderRadius: 6, cursor: "pointer", padding: 6,
                    color: colors.text,
                  }}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div style={{ gridColumn: "1 / -1", fontSize: 12, color: colors.muted, textAlign: "center", padding: 12 }}>
                No icons found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}