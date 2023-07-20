import { nanoid } from 'nanoid';
import { createApp, reactive } from 'petite-vue';
import { Sortable } from '@shopify/draggable';

/**
 * Module
 */
export default class Module {
  constructor() {
    this.init();
  }

  init() {
    console.log('Module.init()');

    this.addMarkup();

    /** 
    [
      {
        title: 'List A',
        id: null
        items: [
          title: 'Item A1',
          id: null
        ]
      },
      ...
    ]
    */
    //
    // SHARED STORE
    const store = reactive({
      appId: 'qjdwfxcav',

      items: [],

      load() {
        console.log('loadItems()');

        if (this.items.length) {
          return;
        }

        let _data = localStorage.getItem(this.appId + '--items');
        let _items;

        console.log('_data', _data);
        try {
          _items = JSON.parse(_data);
        } catch (error) {}

        console.log('_items', _items);

        this.set(_items);
      },
      save() {
        console.log('save()', this.items);

        localStorage.setItem(
          this.appId + '--items',
          JSON.stringify(this.items)
        );
      },

      add(title) {
        if (!title) {
          return;
        }

        const id = nanoid();

        this.set([
          {
            id: id,
            title: title
          },
          ...this.items
        ]);

        this.save();

        return id;
      },
      remove(id) {
        console.log('remove()', id);
        if (!id) {
          return;
        }

        this.set(this.items.filter((item) => item.id !== id));

        this.save();

        return id;
      },

      move(oldIndex, newIndex) {
        console.log('move()', oldIndex, newIndex);

        const _items = this.items;

        _items.splice(newIndex, 0, _items.splice(oldIndex, 1)[0]);

        this.set(_items);

        this.save();
      },

      set(items) {
        console.log('set()', items);

        if (!items) {
          return;
        }

        this.items = items;
      },

      get() {
        return this.items;
      }
    });

    //
    // UI INPUT
    //
    createApp({
      store,

      visible: false,
      newItem: null,
      selectedItemId: '',

      show() {
        this.visible = true;
      },
      hide() {
        this.visible = false;
      },
      addItem() {
        const id = this.store.add(this.newItem);

        this.newItem = '';
        this.selectedItemId = id;
      },
      onMount() {
        this.store.load();
      }
    }).mount('.app--select');

    //
    // LIST
    //
    createApp({
      store,

      sortable: null,

      removeItem(id) {
        console.log('removeItem()', id);

        this.store.remove(id);
      },
      onMount() {
        console.log('List.onMount()');
      },
      onUnmount() {
        console.log('List.onUnmount()');
      },
      onEffect(rootElement) {
        console.log('List.onEffect()', rootElement);

        this.makeSortable(rootElement.querySelector('ul'));
      },
      onInput(key, value) {
        console.log('List.onInput()', key, value);
      },
      makeSortable(rootElement) {
        console.log('List.makeSortable()', rootElement);

        if (!rootElement) {
          return;
        }

        if (this.sortable) {
          this.sortable.destroy();
          this.sortable = null;
        }

        this.sortable = new Sortable(rootElement, {
          draggable: 'li'
        });

        this.sortable.on('sortable:stop', ({ oldIndex, newIndex } = event) => {
          console.log('sortable:stop', oldIndex, newIndex);

          this.store.move(oldIndex, newIndex);
        });
      }
    }).mount('.app--list');
  }

  addMarkup() {
    document.body.insertAdjacentHTML('beforeend', template);
  }
}

const template = `<div class="app app--select" v-cloak v-scope @mounted="onMount()">
<button v-if="!visible" @click="show">
  🟢
</button>

<button v-if="visible" @click="hide">
  🔴
</button>

<div v-if="visible">
  <input
    type="text"
    v-model="newItem"
    @keyup.enter="addItem()"
  /><button @click="addItem()">
    🚀
  </button>

  <div>
    <select v-model="selectedItemId">
      <option disabled value="">Choose item</option>
      <option v-for="item in store.items" :value="item.id" :key="item.id">
        {{item.title}}
      </option>
    </select>
    <span
      >{{store.items.filter(item => item.id ===
        selectedItemId)?.[0]?.title}}</span
    >
  </div>
</div>
</div>

<div
class="app app--list"
v-cloak
v-scope
v-effect="onEffect($el, store.items)"
@mounted="onMount($el)"
@unmounted="onUnmount()"
>
<ul class="list">
  <li v-for="item in store.items" class="list-item" :key="item.id">
    {{item.title}}
    <button @click="removeItem(item.id)">❌</button>
  </li>
</ul>
</div>
`;
