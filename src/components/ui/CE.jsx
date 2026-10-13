import { useRef, useEffect, useCallback } from "react";
import { renderMarkedHtml, getSelectionOffsets, setCaretAtOffset, setSelectionRange, shiftMarksForEdit, detectTextDirection } from "../../utils/richText";

function CE({
  blockId, initialText, marks, placeholder, style,
  onInput, onKeyDown, blockRefs, locked,
  onMarksChange, onSelectionChange,
}) {
  const nodeRef = useRef(null);
  const lastTextRef = useRef(initialText ?? "");
  const lastMarksKeyRef = useRef(JSON.stringify(marks || []));
  const mounted = useRef(false);

  const renderContent = useCallback((text, m) => {
    if (!nodeRef.current) return;
    nodeRef.current.innerHTML = renderMarkedHtml(text, m);
    nodeRef.current.dir = detectTextDirection(text);
  }, []);

  const attach = useCallback(node => {
    if (!node) return;
    nodeRef.current = node;
    if (blockRefs) blockRefs.current[blockId] = node;
    if (!mounted.current) {
      renderContent(initialText ?? "", marks || []);
      lastTextRef.current = initialText ?? "";
      lastMarksKeyRef.current = JSON.stringify(marks || []);
      mounted.current = true;
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) return;
    const newMarksKey = JSON.stringify(marks || []);
    const textChanged = (initialText ?? "") !== lastTextRef.current;
    const marksChanged = newMarksKey !== lastMarksKeyRef.current;
    if (!textChanged && !marksChanged) return;
    const node = nodeRef.current;
    if (!node) return;
    const hadFocus = document.activeElement === node;
    const prevOffsets = hadFocus ? getSelectionOffsets(node) : null;
    renderContent(initialText ?? "", marks || []);
    lastTextRef.current = initialText ?? "";
    lastMarksKeyRef.current = newMarksKey;
    if (hadFocus && prevOffsets) {
      try {
        if (prevOffsets.start === prevOffsets.end) setCaretAtOffset(node, prevOffsets.end);
        else setSelectionRange(node, prevOffsets.start, prevOffsets.end);
      } catch {}
    }
  }, [initialText, marks]);

  function handleInput(e) {
    const newText = e.currentTarget.textContent ?? "";
    const oldText = lastTextRef.current;
    e.currentTarget.dir = detectTextDirection(newText);
    if (marks && marks.length) onMarksChange?.(blockId, shiftMarksForEdit(marks, oldText, newText));
    lastTextRef.current = newText;
    onInput?.(e);
  }

  function handleSelect() {
    const node = nodeRef.current;
    if (!node || locked) return;
    const offsets = getSelectionOffsets(node);
    if (!offsets || offsets.start === offsets.end) { onSelectionChange?.(blockId, null, null); return; }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    onSelectionChange?.(blockId, offsets, sel.getRangeAt(0).getBoundingClientRect());
  }

  return (
    <div ref={attach} contentEditable={!locked} suppressContentEditableWarning
      data-placeholder={locked ? undefined : placeholder}
      onInput={locked ? undefined : handleInput}
      onKeyDown={locked ? undefined : onKeyDown}
      onMouseUp={locked ? undefined : handleSelect}
      onKeyUp={locked ? undefined : handleSelect}
      onBlur={() => {
  setTimeout(() => {
    const active = document.activeElement;
    if (active?.closest("[data-selection-toolbar]")) return;
    onSelectionChange?.(blockId, null, null);
  }, 0);
}}
      style={{outline:"none",whiteSpace:"pre-wrap",wordBreak:"break-word",position:"relative",cursor:locked?"default":"text",...style}}
    />
  );
}

export default CE;