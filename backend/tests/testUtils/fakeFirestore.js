let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `fake_${idCounter}`;
}

export function createFakeFirestore() {
  // path (string) -> plain data object
  const store = new Map();

  function directChildren(basePath) {
    const prefix = `${basePath}/`;
    const results = [];
    for (const [path, data] of store.entries()) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      if (rest.includes('/')) continue; // not a direct child doc
      results.push({ id: rest, path, data });
    }
    return results;
  }

  function applyFieldValues(existing, incoming) {
    const out = { ...existing };
    for (const [key, value] of Object.entries(incoming)) {
      if (value && typeof value === 'object' && value.__fakeFieldValueOp) {
        if (value.__fakeFieldValueOp === 'serverTimestamp') {
          const now = Date.now();
          out[key] = { _seconds: Math.floor(now / 1000), _nanoseconds: (now % 1000) * 1e6 };
        } else if (value.__fakeFieldValueOp === 'increment') {
          out[key] = (typeof existing[key] === 'number' ? existing[key] : 0) + value.amount;
        }
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  function makeDocRef(path) {
    return {
      id: path.split('/').pop(),
      path,
      collection(name) {
        return makeCollectionRef(`${path}/${name}`);
      },
      async get() {
        const data = store.get(path);
        return {
          exists: store.has(path),
          id: path.split('/').pop(),
          data: () => (data ? { ...data } : undefined),
        };
      },
      async set(data, opts = {}) {
        const existing = opts.merge ? store.get(path) || {} : {};
        store.set(path, applyFieldValues(existing, data));
      },
      async update(data) {
        if (!store.has(path)) {
          throw new Error(`fakeFirestore: cannot update nonexistent doc at ${path}`);
        }
        store.set(path, applyFieldValues(store.get(path), data));
      },
      async delete() {
        store.delete(path);
      },
    };
  }

  function makeCollectionRef(basePath) {
    let orderField = null;
    let orderDir = 'asc';
    let limitCount = null;
    let cursorAfterPath = null;

    function sortedFilteredChildren() {
      let children = directChildren(basePath);
      if (orderField) {
        children = [...children].sort((a, b) => {
          const av = a.data[orderField];
          const bv = b.data[orderField];
          const an = av?._seconds ?? (typeof av === 'number' ? av : 0);
          const bn = bv?._seconds ?? (typeof bv === 'number' ? bv : 0);
          return orderDir === 'desc' ? bn - an : an - bn;
        });
      }
      if (cursorAfterPath) {
        const idx = children.findIndex((c) => c.path === cursorAfterPath);
        children = idx === -1 ? [] : children.slice(idx + 1);
      }
      return children;
    }

    const ref = {
      doc(id) {
        const docId = id || nextId();
        return makeDocRef(`${basePath}/${docId}`);
      },
      async add(data) {
        const docId = nextId();
        const path = `${basePath}/${docId}`;
        store.set(path, applyFieldValues({}, data));
        return { id: docId };
      },
      orderBy(field, dir = 'asc') {
        orderField = field;
        orderDir = dir;
        return ref;
      },
      limit(n) {
        limitCount = n;
        return ref;
      },
      startAfter(docSnapshotOrRef) {
        const path = docSnapshotOrRef?.ref?.path || docSnapshotOrRef?.path || null;
        cursorAfterPath = path;
        return ref;
      },
      async get() {
        let children = sortedFilteredChildren();
        if (limitCount != null) children = children.slice(0, limitCount);
        return {
          empty: children.length === 0,
          docs: children.map((c) => ({
            id: c.id,
            ref: makeDocRef(c.path),
            data: () => ({ ...c.data }),
          })),
        };
      },
    };
    return ref;
  }

  return {
    collection(name) {
      return makeCollectionRef(name);
    },
    batch() {
      const ops = [];
      return {
        set(ref, data) { ops.push({ type: 'set', ref, data }); },
        update(ref, data) { ops.push({ type: 'update', ref, data }); },
        delete(ref) { ops.push({ type: 'delete', ref }); },
        async commit() {
          for (const op of ops) {
            if (op.type === 'set') await op.ref.set(op.data);
            else if (op.type === 'update') await op.ref.update(op.data);
            else if (op.type === 'delete') await op.ref.delete();
          }
        },
      };
    },
    // Test-only escape hatch to inspect raw state if ever needed.
    _dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

export const fakeFieldValue = {
  serverTimestamp: () => ({ __fakeFieldValueOp: 'serverTimestamp' }),
  increment: (amount) => ({ __fakeFieldValueOp: 'increment', amount }),
};
