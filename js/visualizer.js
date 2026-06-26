// ============================================================
//  EstruturaPRO — Data Structure Visualizer
// ============================================================

class Visualizer {
  constructor(canvasId, moduleId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.moduleId = moduleId;
    this.animating = false;
    this.items = [];
    this.highlighted = new Set();
    this.animFrame = null;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width  = parent.clientWidth;
    this.canvas.height = Math.min(220, parent.clientHeight || 220);
    this.draw();
  }

  // ── Initialize with default data ──────────────────────────
  init() {
    switch (this.moduleId) {
      case 'arrays':      this.items = [10, 25, 7, 42, 18, 33]; this.draw(); break;
      case 'linked-list': this.items = [10, 20, 30, 40]; this.draw(); break;
      case 'stack':       this.items = []; this.draw(); break;
      case 'queue':       this.items = []; this.draw(); break;
      case 'tree':        this.items = [50,30,70,20,40,60,80]; this.draw(); break;
      case 'graph':       this.draw(); break;
    }
  }

  // ── Generic draw dispatcher ───────────────────────────────
  draw() {
    if (!this.ctx) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (this.moduleId) {
      case 'arrays':      this.drawArray(); break;
      case 'linked-list': this.drawLinkedList(); break;
      case 'stack':       this.drawStack(); break;
      case 'queue':       this.drawQueue(); break;
      case 'tree':        this.drawTree(); break;
      case 'graph':       this.drawGraph(); break;
    }
  }

  // ── Color helpers ─────────────────────────────────────────
  moduleColor() {
    const colors = {
      'arrays':      '#6366f1',
      'linked-list': '#06b6d4',
      'stack':       '#10b981',
      'queue':       '#f59e0b',
      'tree':        '#a855f7',
      'graph':       '#ec4899',
    };
    return colors[this.moduleId] || '#6366f1';
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Box drawing helper ────────────────────────────────────
  drawBox(x, y, w, h, value, highlighted = false, label = null) {
    const { ctx } = this;
    const color = this.moduleColor();
    const r = 8;

    // Background
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = highlighted
      ? this.hexToRgba(color, 0.35)
      : 'rgba(22,26,50,0.9)';
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.strokeStyle = highlighted ? color : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = highlighted ? 2 : 1;
    ctx.stroke();

    // Glow if highlighted
    if (highlighted) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Value text
    ctx.font = `bold 16px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = highlighted ? '#fff' : 'rgba(255,255,255,0.85)';
    ctx.fillText(String(value), x + w/2, y + h/2);

    // Index label below
    if (label !== null) {
      ctx.font = `11px 'Inter', sans-serif`;
      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.fillText(String(label), x + w/2, y + h + 14);
    }
  }

  // ── Arrow drawing helper ──────────────────────────────────
  drawArrow(fromX, fromY, toX, toY, color = null) {
    const { ctx } = this;
    const c = color || this.moduleColor();
    const headLen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI/6), toY - headLen * Math.sin(angle - Math.PI/6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI/6), toY - headLen * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
  }

  // ============================================================
  // ARRAY Visualizer
  // ============================================================
  drawArray() {
    const { ctx, canvas, items } = this;
    if (!items.length) return;

    const boxW = 56, boxH = 48, gap = 10;
    const total = items.length * (boxW + gap) - gap;
    const startX = (canvas.width - total) / 2;
    const startY = (canvas.height - boxH) / 2 - 10;

    // Draw memory address bar
    ctx.font = '11px Inter';
    ctx.fillStyle = 'rgba(99,102,241,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Memória Contígua', canvas.width/2, startY - 20);

    // Connecting line behind boxes
    ctx.beginPath();
    ctx.moveTo(startX, startY + boxH/2);
    ctx.lineTo(startX + total, startY + boxH/2);
    ctx.strokeStyle = 'rgba(99,102,241,0.15)';
    ctx.lineWidth = boxH + 2;
    ctx.stroke();

    items.forEach((val, i) => {
      const x = startX + i * (boxW + gap);
      const highlighted = this.highlighted.has(i);
      this.drawBox(x, startY, boxW, boxH, val, highlighted, i);
    });
  }

  async animateArrayAccess(index) {
    this.highlighted.clear();
    this.highlighted.add(index);
    this.draw();
    await this.sleep(800);
    this.highlighted.clear();
    this.draw();
  }

  async animateArrayInsert(value, index) {
    const pos = index !== undefined ? index : this.items.length;
    // Highlight shift
    for (let i = this.items.length - 1; i >= pos; i--) {
      this.highlighted.clear();
      this.highlighted.add(i);
      this.draw();
      await this.sleep(120);
    }
    this.items.splice(pos, 0, value);
    this.highlighted.clear();
    this.highlighted.add(pos);
    this.draw();
    await this.sleep(600);
    this.highlighted.clear();
    this.draw();
  }

  async animateArrayRemove(index) {
    const pos = index !== undefined ? index : this.items.length - 1;
    this.highlighted.add(pos);
    this.draw();
    await this.sleep(500);
    this.items.splice(pos, 1);
    this.highlighted.clear();
    this.draw();
  }

  // ============================================================
  // LINKED LIST Visualizer
  // ============================================================
  drawLinkedList() {
    const { ctx, canvas, items } = this;
    if (!items.length) {
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.font = '14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Lista vazia — insira elementos', canvas.width/2, canvas.height/2);
      return;
    }

    const nodeW = 60, nodeH = 40, ptrW = 22, gap = 28;
    const total = items.length * (nodeW + ptrW + gap) - gap;
    const startX = Math.max(20, (canvas.width - total) / 2);
    const y = (canvas.height - nodeH) / 2;

    // HEAD label
    ctx.font = 'bold 11px Inter';
    ctx.fillStyle = this.moduleColor();
    ctx.textAlign = 'center';
    ctx.fillText('HEAD', startX + nodeW/2, y - 18);
    // Arrow from HEAD
    this.drawArrow(startX + nodeW/2, y - 14, startX + nodeW/2, y, this.moduleColor());

    items.forEach((val, i) => {
      const x = startX + i * (nodeW + ptrW + gap);
      const isHighlighted = this.highlighted.has(i);

      // Data box
      this.drawBox(x, y, nodeW, nodeH, val, isHighlighted);

      // Pointer box
      const ptrX = x + nodeW;
      const c = this.moduleColor();
      ctx.beginPath();
      ctx.roundRect(ptrX, y, ptrW, nodeH, [0, 8, 8, 0]);
      ctx.fillStyle = isHighlighted ? this.hexToRgba(c, 0.2) : 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(ptrX, y, ptrW, nodeH, [0, 8, 8, 0]);
      ctx.strokeStyle = isHighlighted ? c : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (i < items.length - 1) {
        // Arrow to next node
        const nextX = x + nodeW + ptrW + gap;
        this.drawArrow(ptrX + ptrW, y + nodeH/2, nextX, y + nodeH/2, c);
      } else {
        // NULL indicator
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('∅', ptrX + ptrW/2, y + nodeH/2 + 1);
      }
    });
  }

  async animateListInsert(value, atStart = true) {
    const pos = atStart ? 0 : this.items.length;
    this.items.splice(pos, 0, value);
    this.highlighted.clear();
    this.highlighted.add(pos);
    this.draw();
    await this.sleep(700);
    this.highlighted.clear();
    this.draw();
  }

  async animateListRemove(atStart = true) {
    if (!this.items.length) return;
    const pos = atStart ? 0 : this.items.length - 1;
    this.highlighted.add(pos);
    this.draw();
    await this.sleep(500);
    this.items.splice(pos, 1);
    this.highlighted.clear();
    this.draw();
  }

  // ============================================================
  // STACK Visualizer
  // ============================================================
  drawStack() {
    const { ctx, canvas, items } = this;
    const boxW = 120, boxH = 40, gap = 4;
    const maxVisible = 5;
    const visible = items.slice(-maxVisible);
    const totalH = visible.length * (boxH + gap);
    const baseY = canvas.height - 20;
    const x = (canvas.width - boxW) / 2;

    // Base platform
    ctx.beginPath();
    ctx.roundRect(x - 10, baseY - 2, boxW + 20, 6, 3);
    ctx.fillStyle = 'rgba(16,185,129,0.3)';
    ctx.fill();

    // Empty state
    if (!items.length) {
      ctx.font = '13px Inter';
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('Pilha vazia', canvas.width/2, baseY - 20);
    }

    visible.forEach((val, i) => {
      const isTop = i === visible.length - 1;
      const y = baseY - (i + 1) * (boxH + gap);
      this.drawBox(x, y, boxW, boxH, val, isTop || this.highlighted.has(items.length - visible.length + i));

      // TOP label
      if (isTop) {
        ctx.font = 'bold 10px Inter';
        ctx.fillStyle = this.moduleColor();
        ctx.textAlign = 'left';
        ctx.fillText('◄ TOPO', x + boxW + 8, y + boxH/2 + 1);
      }
    });

    // PUSH/POP animation arrow hint
    if (items.length > 0) {
      const topY = baseY - visible.length * (boxH + gap) - 20;
      ctx.font = '11px Inter';
      ctx.fillStyle = 'rgba(16,185,129,0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('↑ push  |  pop ↓', canvas.width/2, topY);
    }
  }

  async animateStackPush(value) {
    this.items.push(value);
    this.highlighted.clear();
    this.highlighted.add(this.items.length - 1);
    this.draw();
    await this.sleep(700);
    this.highlighted.clear();
    this.draw();
  }

  async animateStackPop() {
    if (!this.items.length) return null;
    const val = this.items[this.items.length - 1];
    this.highlighted.add(this.items.length - 1);
    this.draw();
    await this.sleep(500);
    this.items.pop();
    this.highlighted.clear();
    this.draw();
    return val;
  }

  // ============================================================
  // QUEUE Visualizer
  // ============================================================
  drawQueue() {
    const { ctx, canvas, items } = this;
    const boxW = 64, boxH = 48, gap = 8;
    const maxVisible = 5;
    const visible = items.slice(0, maxVisible);
    const total = visible.length * (boxW + gap) - gap;
    const startX = (canvas.width - Math.max(total, boxW * 3)) / 2;
    const y = (canvas.height - boxH) / 2;

    // Empty state
    if (!items.length) {
      ctx.font = '13px Inter';
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('Fila vazia', canvas.width/2, canvas.height/2);
      return;
    }

    // ENQUEUE side arrow
    ctx.font = '11px Inter';
    ctx.fillStyle = 'rgba(245,158,11,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('← enqueue', startX + total + 50, y + boxH/2 + 1);

    // DEQUEUE side arrow
    ctx.fillText('dequeue →', startX - 60, y + boxH/2 + 1);

    visible.forEach((val, i) => {
      const x = startX + i * (boxW + gap);
      const isFront = i === 0;
      const isBack  = i === visible.length - 1;
      this.drawBox(x, y, boxW, boxH, val,
        this.highlighted.has(i) || isFront && this.highlighted.has('front'));

      if (isFront) {
        ctx.font = 'bold 10px Inter';
        ctx.fillStyle = this.moduleColor();
        ctx.textAlign = 'center';
        ctx.fillText('FRENTE', x + boxW/2, y + boxH + 18);
      }
      if (isBack) {
        ctx.font = 'bold 10px Inter';
        ctx.fillStyle = 'rgba(245,158,11,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('FIM', x + boxW/2, y - 14);
      }

      // Arrow between boxes
      if (i < visible.length - 1) {
        const nextX = startX + (i+1) * (boxW + gap);
        this.drawArrow(x + boxW + 2, y + boxH/2, nextX - 2, y + boxH/2, this.moduleColor());
      }
    });

    if (items.length > maxVisible) {
      ctx.font = '12px Inter';
      ctx.fillStyle = 'rgba(245,158,11,0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(`+${items.length - maxVisible} mais...`, startX + total + gap, y + boxH/2 + 1);
    }
  }

  async animateQueueEnqueue(value) {
    this.items.push(value);
    this.highlighted.clear();
    this.highlighted.add(this.items.length - 1);
    this.draw();
    await this.sleep(700);
    this.highlighted.clear();
    this.draw();
  }

  async animateQueueDequeue() {
    if (!this.items.length) return null;
    const val = this.items[0];
    this.highlighted.add('front');
    this.draw();
    await this.sleep(500);
    this.items.shift();
    this.highlighted.clear();
    this.draw();
    return val;
  }

  // ============================================================
  // BINARY TREE Visualizer
  // ============================================================
  drawTree() {
    const { ctx, canvas, items } = this;
    if (!items.length) return;

    // Build BST
    const root = this.buildBST(items);

    // Calculate positions
    const positions = {};
    const levelGap = 55;
    const getPos = (node, level, minX, maxX) => {
      if (!node) return;
      const x = (minX + maxX) / 2;
      const y = 30 + level * levelGap;
      positions[node.val] = { x, y };
      getPos(node.left,  level + 1, minX, x);
      getPos(node.right, level + 1, x, maxX);
    };
    getPos(root, 0, 0, canvas.width);

    // Draw edges
    const drawEdges = (node) => {
      if (!node) return;
      if (node.left) {
        const p = positions[node.val];
        const c = positions[node.left.val];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = 'rgba(168,85,247,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawEdges(node.left);
      }
      if (node.right) {
        const p = positions[node.val];
        const c = positions[node.right.val];
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = 'rgba(168,85,247,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawEdges(node.right);
      }
    };
    drawEdges(root);

    // Draw nodes
    const color = this.moduleColor();
    Object.entries(positions).forEach(([val, pos]) => {
      const isHighlighted = this.highlighted.has(Number(val));
      const r = 20;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? this.hexToRgba(color, 0.5) : 'rgba(22,26,50,0.95)';
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? color : 'rgba(168,85,247,0.4)';
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      ctx.stroke();

      if (isHighlighted) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.font = `bold 13px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isHighlighted ? '#fff' : 'rgba(255,255,255,0.85)';
      ctx.fillText(String(val), pos.x, pos.y);
    });
  }

  buildBST(values) {
    const insert = (root, val) => {
      if (!root) return { val, left: null, right: null };
      if (val < root.val) root.left  = insert(root.left, val);
      else if (val > root.val) root.right = insert(root.right, val);
      return root;
    };
    let root = null;
    values.forEach(v => { root = insert(root, v); });
    return root;
  }

  async animateTreeSearch(value) {
    const root = this.buildBST(this.items);
    const search = async (node, val) => {
      if (!node) return false;
      this.highlighted.add(node.val);
      this.draw();
      await this.sleep(500);
      if (val === node.val) return true;
      if (val < node.val) return await search(node.left, val);
      return await search(node.right, val);
    };
    this.highlighted.clear();
    const found = await search(root, value);
    await this.sleep(600);
    this.highlighted.clear();
    this.draw();
    return found;
  }

  async animateTreeInsert(value) {
    this.items.push(value);
    this.highlighted.clear();
    this.highlighted.add(value);
    this.draw();
    await this.sleep(800);
    this.highlighted.clear();
    this.draw();
  }

  // ============================================================
  // GRAPH Visualizer
  // ============================================================
  drawGraph() {
    const { ctx, canvas } = this;
    const color = this.moduleColor();

    // Fixed graph structure
    const nodes = {
      A: { x: canvas.width * 0.5, y: 35 },
      B: { x: canvas.width * 0.25, y: 110 },
      C: { x: canvas.width * 0.75, y: 110 },
      D: { x: canvas.width * 0.15, y: 185 },
      E: { x: canvas.width * 0.5,  y: 185 },
      F: { x: canvas.width * 0.85, y: 185 },
    };

    const edges = [
      ['A','B'],['A','C'],
      ['B','D'],['B','E'],
      ['C','E'],['C','F'],
      ['D','E'],['E','F'],
    ];

    // Draw edges
    edges.forEach(([u, v]) => {
      const a = nodes[u], b = nodes[v];
      const isVisited = this.highlighted.has(u) && this.highlighted.has(v);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isVisited ? this.hexToRgba(color, 0.8) : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = isVisited ? 2.5 : 1.5;
      ctx.stroke();
    });

    // Draw nodes
    Object.entries(nodes).forEach(([label, pos]) => {
      const isHighlighted = this.highlighted.has(label);
      const r = 20;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? this.hexToRgba(color, 0.45) : 'rgba(22,26,50,0.95)';
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? color : 'rgba(236,72,153,0.35)';
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      ctx.stroke();

      if (isHighlighted) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.font = `bold 14px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isHighlighted ? '#fff' : 'rgba(255,255,255,0.85)';
      ctx.fillText(label, pos.x, pos.y);
    });
  }

  async animateGraphBFS() {
    const adj = {
      A: ['B','C'], B: ['A','D','E'], C: ['A','E','F'],
      D: ['B','E'], E: ['B','C','D','F'], F: ['C','E'],
    };
    const visited = new Set();
    const queue = ['A'];
    visited.add('A');

    while (queue.length) {
      const v = queue.shift();
      this.highlighted.add(v);
      this.draw();
      await this.sleep(600);
      for (const nb of adj[v]) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    await this.sleep(800);
    this.highlighted.clear();
    this.draw();
  }

  // ── Utility ──────────────────────────────────────────────
  sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  reset() {
    this.highlighted.clear();
    switch (this.moduleId) {
      case 'arrays':      this.items = [10, 25, 7, 42, 18, 33]; break;
      case 'linked-list': this.items = [10, 20, 30, 40]; break;
      case 'stack':       this.items = []; break;
      case 'queue':       this.items = []; break;
      case 'tree':        this.items = [50,30,70,20,40,60,80]; break;
      case 'graph':       break;
    }
    this.draw();
  }
}
