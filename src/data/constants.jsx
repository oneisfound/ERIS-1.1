import {
  Star, Heart, Flame, Zap, Coffee, Book, BookOpen, Bookmark, Briefcase,
  Calendar, Camera, Car, Clock, Cloud, Code, Compass, CreditCard,
  Database, Diamond, Dumbbell, Feather, FileText, Film, Flag, Flower,
  Folder, Gift, Globe, GraduationCap, Hammer, Headphones, Home,
  Image as ImageIcon, Key, Laptop, Leaf, Lightbulb, Lock,
  Map, MapPin, Medal, Mic, Moon, Mountain, Music, Package, Palette,
  Paperclip, Pencil, Phone, PiggyBank, Plane, Puzzle, Rocket, Ruler,
  School, Scissors, Settings, Shield, ShoppingBag, ShoppingCart, Smile,
  Snowflake, Sparkles, Sun, Sunrise, Sunset, Target, Tent, Ticket,
  Trash2, TreePine, Trophy, Umbrella, User, Users, Utensils, Video,
  Wallet, Watch, Wind, Wrench,
  Type, Heading1, Heading2, Heading3, Heading4, List, ListOrdered,
  CheckSquare, ChevronRight, Quote, Minus, MessageSquare,
  Columns3, ListTree,
  Table, LayoutGrid, Kanban, List as ListIcon,
  Tag, Hash, Link, Mail, PhoneCall,
  CalendarDays,
  LayoutTemplate, Sigma ,
} from "lucide-react";

const ICON_LIBRARY = {
  Star, Heart, Flame, Zap, Coffee, Book, BookOpen, Bookmark, Briefcase,
  Calendar, Camera, Car, Clock, Cloud, Code, Compass, CreditCard, Database,
  Diamond, Dumbbell, Feather, FileText, Film, Flag, Flower, Folder, Gift,
  Globe, GraduationCap, Hammer, Headphones, Home, ImageIcon, Key, Laptop,
  Leaf, Lightbulb, Lock, Map, MapPin, Medal, Mic, Moon, Mountain, Music,
  Package, Palette, Paperclip, Pencil, Phone, PiggyBank, Plane, Puzzle,
  Rocket, Ruler, School, Scissors, Settings, Shield, ShoppingBag,
  ShoppingCart, Smile, Snowflake, Sparkles, Sun, Sunrise, Sunset, Target,
  Tent, Ticket, Trash2, TreePine, Trophy, Umbrella, User, Users, Utensils,
  Video, Wallet, Watch, Wind, Wrench,
};
const ICON_NAMES = Object.keys(ICON_LIBRARY);
const ICON_COLORS = ["#FFFFFF","#5A5A57","#C4552D","#CB912F","#4A7A3D","#2D7A6B","#3B6FAE","#5E4DA6","#A5459E","#B5473A"];
const DATABASE_COLORS = ["#FFFFFF","#9065B0","#448361","#E03E3E","#C14C8A","#787774","#273669","#7ADEB1","#D9730D","#F09EA8","#9F6B53","#337EA9","#B0ED77","#CB912F","#E3A96F"];
const COVER_COLORS = ["#D9E4DD","#E8DFD0","#E3DCE8","#DCE6EF","#F0DCD9","#F5E6D3","#D6E8D6","#E8D6E8"];
const CALLOUT_EMOJIS = ["💡","📌","⚠️","✅","❗","🔥","📝","🎯","❓","⭐","🚀","💬"];
const SIZE_BY_LEVEL = { 1:30, 2:24, 3:20, 4:16 };
const QUICK_EMOJIS = [
  "📄","📝","📁","🗂️","📚","🎯","🚀","💡","⭐","🔥","❤️","🎨","🏆","🌟","💼","🔑","📊","📈","🎵","🌍","🏠","✅","⚡","🧠","🛠️","🌿","🎉","💎","🔒","📌",
  "📅","⏰","⌛","🧭","🗺️","✈️","🚗","🚲","🏃","🏋️","⚽","🎮","🎬","🎧","🎤","🎸","🎹","🍎","☕","🍕","🌱","🌸","🌞","🌙","☁️","🌈","❄️","🌊","🐶","🐱","🦊","🐼","🦄","🦋","💬","📣","📢","📎","🔗","🔔","🔒","🔓","⚙️","🧪","🔬","💻","📱","🖥️","💰","💳","🛒","🎁","🏷️","📍","🚩","🏁"
];
const COLUMN_PRESETS = [
  { label:"2 equal", cols:2, widths:[50,50] },
  { label:"3 equal", cols:3, widths:[33.33,33.33,33.33] },
  { label:"Left wide", cols:2, widths:[70,30] },
  { label:"Right wide", cols:2, widths:[30,70] },
  { label:"4 equal", cols:4, widths:[25,25,25,25] },
];
const DB_VIEWS = ["table","gallery","board","list","calendar","timeline"];
const DB_VIEW_ICONS = {
  table: <Table size={14}/>,
  gallery: <LayoutGrid size={14}/>,
  board: <Kanban size={14}/>,
  list: <ListIcon size={14}/>,
  calendar: <CalendarDays size={14}/>,
  timeline: <Minus size={14}/>,
};
const DB_VIEW_LABELS = { 
  table:"Table", gallery:"Gallery", board:"Board", 
  list:"List", calendar:"Calendar", timeline:"Timeline" 
};
const NUMBER_FORMATS = {
  number:       { label:"Number",    format: v => String(parseFloat(v)||0) },
  currency_usd: { label:"$ Dollar",  format: v => `$${parseFloat(v||0).toFixed(2)}` },
  currency_eur: { label:"€ Euro",    format: v => `€${parseFloat(v||0).toFixed(2)}` },
  currency_gbp: { label:"£ Pound",   format: v => `£${parseFloat(v||0).toFixed(2)}` },
  percent:      { label:"Percent %", format: v => `${parseFloat(v||0).toFixed(1)}%` },
};

const FILTER_OPERATORS = {
  text:        ["contains","does not contain","is","is not","is empty","is not empty"],
  number:      ["=","≠","<",">","≤","≥","is empty","is not empty"],
  select:      ["is","is not","is empty","is not empty"],
  "multi-select": ["contains","does not contain","is empty","is not empty"],
  checkbox:    ["is checked","is not checked"],
  date:        ["is","is before","is after","is empty","is not empty"],
  url:         ["contains","is empty","is not empty"],
  email:       ["contains","is empty","is not empty"],
  phone:       ["contains","is empty","is not empty"],
  progress:    ["=","≠","<",">","≤","≥"],
  formula:     ["contains","is empty","is not empty"],
  relation:    ["is empty","is not empty"],
  rollup:      ["=","≠","<",">","≤","≥"],
};
const PROP_TYPES = [
  "text","number","select","multi-select","checkbox",
  "date","url","email","phone",
  "relation","rollup","formula","progress"
];
const PROP_ICONS = {
  text: <Type size={12}/>,
  number: <Hash size={12}/>,
  select: <Tag size={12}/>,
  "multi-select": <Tag size={12}/>,
  checkbox: <CheckSquare size={12}/>,
  date: <CalendarDays size={12}/>,
  url: <Link size={12}/>,
  email: <Mail size={12}/>,
  phone: <PhoneCall size={12}/>,
  progress: <Sigma size={12}/>,
  relation: <Link size={12}/>,
  rollup: <Sigma size={12}/>,
  formula: <Sigma size={12}/>,
};

const SLASH_ITEMS = [
  { type:"paragraph", label:"Text", hint:"Plain paragraph", Icon:Type, kw:["text","paragraph"] },
  { type:"heading1", label:"Heading 1", hint:"Biggest heading", Icon:Heading1, kw:["heading","h1"] },
  { type:"heading2", label:"Heading 2", hint:"Large heading", Icon:Heading2, kw:["heading","h2"] },
  { type:"heading3", label:"Heading 3", hint:"Medium heading", Icon:Heading3, kw:["heading","h3"] },
  { type:"heading4", label:"Heading 4", hint:"Small heading", Icon:Heading4, kw:["heading","h4"] },
  { type:"toggleHeading1", label:"Toggle Heading 1", hint:"Collapsible h1", Icon:Heading1, kw:["toggle","heading","h1"] },
  { type:"toggleHeading2", label:"Toggle Heading 2", hint:"Collapsible h2", Icon:Heading2, kw:["toggle","heading","h2"] },
  { type:"toggleHeading3", label:"Toggle Heading 3", hint:"Collapsible h3", Icon:Heading3, kw:["toggle","heading","h3"] },
  { type:"toggleHeading4", label:"Toggle Heading 4", hint:"Collapsible h4", Icon:Heading4, kw:["toggle","heading","h4"] },
  { type:"bulleted", label:"Bulleted list", hint:"Simple bullet", Icon:List, kw:["bullet","list"] },
  { type:"numbered", label:"Numbered list", hint:"Numbered items", Icon:ListOrdered, kw:["number","list"] },
  { type:"todo", label:"To-do", hint:"Checkbox task", Icon:CheckSquare, kw:["todo","task"] },
  { type:"toggle", label:"Toggle", hint:"Collapsible section", Icon:ChevronRight, kw:["toggle"] },
  { type:"callout", label:"Callout", hint:"Highlighted note", Icon:MessageSquare, kw:["callout","note"] },
  { type:"quote", label:"Quote", hint:"Block quote", Icon:Quote, kw:["quote"] },
  { type:"divider", label:"Divider", hint:"Separator line", Icon:Minus, kw:["divider","hr"] },
  { type:"toc", label:"Table of contents", hint:"Page outline", Icon:ListTree, kw:["toc","contents"] },
  { type:"page", label:"Page", hint:"Nested subpage", Icon:FileText, kw:["page","subpage"] },
  { type:"columns", label:"Columns", hint:"Side-by-side layout", Icon:Columns3, kw:["column","layout"] },
  { type:"image", label:"Image", hint:"Upload a picture", Icon:ImageIcon, kw:["image","photo"] },
  { type:"video", label:"Video", hint:"Upload a video", Icon:Video, kw:["video"] },
  { type:"audio", label:"Audio", hint:"Upload audio", Icon:Music, kw:["audio","sound"] },
  { type:"file", label:"File", hint:"Upload any file", Icon:Paperclip, kw:["file","upload"] },
  { type:"database", label:"Database", hint:"Table, gallery, board & more", Icon:Database, kw:["database","table","gallery","board"] },
  { type:"link", label:"Link", hint:"Add a web link with preview", Icon:Link, kw:["link","url","web"] },
  { type:"embed", label:"Embed", hint:"Embed any website", Icon:Globe, kw:["embed","iframe","website"] },
  { type:"spotify", label:"Spotify", hint:"Embed a Spotify track or playlist", Icon:Music, kw:["spotify","music","song","playlist"] },
  { type:"github", label:"GitHub", hint:"Embed a GitHub repo or file", Icon:Code, kw:["github","code","repo","git"] },
  { type:"youtube", label:"YouTube", hint:"Embed a YouTube video", Icon:Video, kw:["youtube","video","watch"] },
  { type:"twitter", label:"Twitter / X", hint:"Embed a tweet", Icon:MessageSquare, kw:["twitter","tweet","x"] },
  { type:"figma", label:"Figma", hint:"Embed a Figma file", Icon:Palette, kw:["figma","design"] },
  { type:"maps", label:"Google Maps", hint:"Embed a Google Maps location", Icon:MapPin, kw:["maps","google","location"] },
  { type:"spreadsheet", label:"Spreadsheet", hint:"Excel-like grid with formulas", Icon:LayoutTemplate, kw:["spreadsheet","grid","excel","formula","sheet"] },
];

export const FONT_OPTIONS = [
  { id: "default", label: "Default", family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: "google-sans-flex", label: "Google Sans Flex", family: "'Google Sans Flex', sans-serif" },
  { id: "oswald",           label: "Oswald",           family: "'Oswald', sans-serif" },
  { id: "roboto-slab",      label: "Roboto Slab",      family: "'Roboto Slab', serif" },
  { id: "comic-relief",     label: "Comic Relief",     family: "'Comic Relief', cursive" },
  { id: "dm-serif-display", label: "DM Serif Display", family: "'DM Serif Display', serif" },
  { id: "caveat",           label: "Caveat",           family: "'Caveat', cursive" },
  { id: "noto-serif", label: "Noto Serif", family: "'Noto Serif', serif" },
  { id: "playpen-sans-arabic", label: "Playpen Sans Arabic", family: "'Playpen Sans Arabic', cursive" },
  { id: "zain",             label: "Zain",             family: "'Zain', sans-serif" },
  { id: "mono-mixed", label: "Mono", family: "'JetBrains Mono', 'Zain', monospace" },
];

export {
  ICON_LIBRARY,
  ICON_NAMES,
  ICON_COLORS,
  DATABASE_COLORS,
  COVER_COLORS,
  CALLOUT_EMOJIS,
  SIZE_BY_LEVEL,
  QUICK_EMOJIS,
  COLUMN_PRESETS,
  DB_VIEWS,
  DB_VIEW_ICONS,
  DB_VIEW_LABELS,
  NUMBER_FORMATS,
  FILTER_OPERATORS,
  PROP_TYPES,
  PROP_ICONS,
  SLASH_ITEMS,
};

