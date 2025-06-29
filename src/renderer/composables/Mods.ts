import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import type { Item, Option } from '../../env';
import { useI18n } from 'vue-i18n';
import { useTranslate } from './Translate';
import { useInstanceStore, useModsStore } from './Stores';

export function useModsComposable() {
  const { t } = useI18n();
  const { translate } = useTranslate();
  const instanceStore = useInstanceStore();

  const isLoading = ref(true);
  const isDownloading = ref(false);
  const availableItems = ref<Item[]>([]);
  const selectedItems = ref<string[]>([]);
  const selectedOptions = ref<Record<string, Option>>({});
  const translatedDescriptions = ref<Record<string, string>>({});
  const selectedFilter = ref<string>('rsg');
  const mcsrRankedMod = ref<Item | null>(null);

  const filters = [
    { value: 'rsg', label: 'RSG' },
    { value: 'ssg', label: 'SSG' },
    { value: 'ranked', label: 'Ranked' },
  ];

  const fetchMods = async () => {
    isLoading.value = true;
    try {
      // MCSR Ranked Modを取得
      const rankedVersions = await axios.get('https://api.modrinth.com/v2/project/mcsr-ranked/version');
      const compatibleVersion = rankedVersions.data.find((version: any) =>
        version.game_versions.includes('1.16.1') &&
        version.loaders.includes('fabric')
      );
      if (compatibleVersion) {
        const file = compatibleVersion.files.find((file: any) => file.primary);
        if (file) {
          mcsrRankedMod.value = {
            id: 'mcsr-ranked',
            name: 'MCSR Ranked',
            description: t('mcsr-ranked-desc'),
            version: compatibleVersion.version_number,
            traits: ['ranked'],
            options: [{
              id: 'mcsr-ranked',
              name: 'MCSR Ranked',
              url: file.url,
              tag: 'jar'
            }]
          };
        }
      }
      const response = await axios.get('https://raw.githubusercontent.com/tildejustin/mcsr-meta/schema-6/mods.json');
      const allMods = response.data.mods;
      availableItems.value = allMods
        .map((mod: any): Item | null => {
          const versionInfo = mod.versions.find((v: any) => v.target_version.includes('1.16.1'));
          if (!versionInfo) return null;
          const traits: string[] = [];
          if (mod.traits && mod.traits.includes('mac-only')) return null;
          if (mod.modid === 'phosphor') return null;
          const isAccessibility = mod.traits && mod.traits.includes('accessibility');
          const isRecommended = !isAccessibility && (
            mod.recommended === true ||
            mod.recommended === 'true' ||
            mod.recommended === 1 ||
            mod.recommended === undefined ||
            mod.recommended === null ||
            (mod.traits && mod.traits.includes('recommended')) ||
            (mod.tags && mod.tags.includes('recommended'))
          );
          if (isRecommended) traits.push('recommended');
          if (mod.traits && Array.isArray(mod.traits)) {
            const filteredTraits = mod.traits.filter((trait: string) =>
              trait !== 'mac-only' && trait !== 'accessibility'
            );
            traits.push(...filteredTraits);
          }
          if (isAccessibility) traits.push('accessibility');
          return {
            id: mod.modid,
            name: mod.name,
            description: mod.description,
            version: versionInfo.version,
            traits: traits,
            options: [{ id: mod.modid, name: mod.name, url: versionInfo.url, tag: 'jar' }]
          };
        })
        .filter((item: Item | null): item is Item => item !== null);
    } catch (error) {
      // emit('error', t('mods-fetch-err'));
      // emitは外部で使う想定
    } finally {
      isLoading.value = false;
    }
  };

  watch(availableItems, (newItems: Item[]) => {
    newItems.forEach(async (item: Item) => {
      if (item.description) {
        translatedDescriptions.value[item.id] = await translate(item.description);
      }
    });
  }, { deep: true });

  onMounted(fetchMods);

  const filteredItems = computed<Item[]>(() => {
    let items = availableItems.value;
    if (selectedFilter.value === 'ranked' && mcsrRankedMod.value) {
      items = [mcsrRankedMod.value, ...items];
    }
    return items.filter((item: Item) => {
      const traits = item.traits || [];
      if (item.id === 'dynamic-menu-fps' || item.name.toLowerCase().includes('dynamic menu fps')) {
        return false;
      }
      switch (selectedFilter.value) {
        case 'rsg':
          return !traits.includes('ssg-only');
        case 'ssg':
          return !traits.includes('rsg-only');
        case 'ranked':
          const rankedHiddenMods = ['extraoptions', 'extra options', 'fastreset', 'worldpreview', 'forceportmod', 'force port mod', 'atum', 'seedqueue'];
          const shouldHide = rankedHiddenMods.some((hiddenId: string) =>
            item.id === hiddenId ||
            item.name.toLowerCase().includes(hiddenId.toLowerCase())
          );
          if (shouldHide) return false;
          return !traits.includes('ssg-only');
        default:
          return true;
      }
    });
  });

  const onChangeOptions = (val: Record<string, Option>) => {
    selectedOptions.value = val;
  };

  const startDownload = async (emit: (e: string, msg?: string) => void) => {
    const modsToDownload = selectedItems.value.map(id => selectedOptions.value[id]);
    if (modsToDownload.length === 0) {
      emit('error', t('no-mods-selected'));
      return;
    }
    useModsStore().add(modsToDownload.map(m => m.id));
    isDownloading.value = true;
    try {
      const modsDir = `${instanceStore.getLauncherRoot()}/instances/${instanceStore.getInstanceName()}/.minecraft/mods`;
      await window.bafv4.createDirectory(modsDir);
      const op = JSON.parse(JSON.stringify(modsToDownload));
      const to = JSON.parse(JSON.stringify(modsDir));
      window.bafv4.startDarwin(op, to);
    } catch (error: any) {
      emit('error', error.message || 'Download failed');
      isDownloading.value = false;
    }
  };

  // --- Progress Tracking ---
  const percent = ref(0);
  const state = ref(0);
  if (typeof window !== 'undefined' && window.bafv4) {
    window.bafv4.tick((s: number, p: number, _t: any) => {
      state.value = s;
      if (s == 1) percent.value = p;
    });
    window.bafv4.catchDarwinErr((_s: any, m: string) => {
      // emit('error', m); // emitは外部で使う想定
      isDownloading.value = false;
    });
  }

  // --- Select All Recommended ---
  const selectAllRecommended = () => {
    const recommendedItems = filteredItems.value.filter((item: Item) => {
      const traits = item.traits || [];
      return traits.includes('recommended');
    });
    // Rankedフィルター選択時はMCSR Rankedも追加
    if (selectedFilter.value === 'ranked' && mcsrRankedMod.value) {
      recommendedItems.push(mcsrRankedMod.value);
    }
    // 現在選択されているアイテムに、おすすめアイテムを追加
    const currentSelected = new Set(selectedItems.value);
    recommendedItems.forEach(item => currentSelected.add(item.id));
    selectedItems.value = Array.from(currentSelected);
  };

  /**
   * MCSR Meta JSONから抽出したIDとファイル名パターンの対応表
   * https://raw.githubusercontent.com/tildejustin/mcsr-meta/schema-6/mods.json から生成
   */
  const MOD_ID_PATTERNS: Record<string, string[]> = {
    "anchiale": ["anchiale-3.1.0+1.8.x.jar"],
    "antigone": ["antigone-1.16.1-2.0.0.jar"],
    "antiresourcereload": [
      "antiresourcereload-4.0.1+1.17.1-1.18.1.jar",
      "antiresourcereload-4.0.1+1.16.5.jar",
      "antiresourcereload-5.2.0+1.16.1.jar",
      "antiresourcereload-4.0.3+1.15.2.jar",
      "antiresourcereload-4.0.2+1.14.4.jar",
      "antiresourcereload-5.1.0+20w14infinite.jar",
      "antiresourcereload-4.0.1+1.13.2.jar",
      "antiresourcereload-4.0.0+1.12.2.jar",
      "antiresourcereload-3.0.0+1.11.2.jar",
      "antiresourcereload-2.0.0+1.10.2.jar",
      "antiresourcereload-1.0.0+1.9.4.jar",
      "antiresourcereload-0.1.0+1.8.9.jar"
    ],
    "atum": ["atum-1.16.1-1.1.2.jar"],
    "bobby": [
      "bobby-4.0.1+1.17.1-1.18.1.jar",
      "bobby-4.0.1+1.16.5.jar",
      "bobby-4.0.1+1.16.1.jar",
      "bobby-4.0.1+1.15.2.jar",
      "bobby-4.0.1+1.14.4.jar",
      "bobby-4.0.1+1.13.2.jar",
      "bobby-4.0.1+1.12.2.jar",
      "bobby-4.0.1+1.11.2.jar",
      "bobby-4.0.1+1.10.2.jar",
      "bobby-4.0.1+1.9.4.jar",
      "bobby-4.0.1+1.8.9.jar"
    ],
    "chunkcacher": ["chunkcacher-1.16.1-1.0.0.jar"],
    "cullleaves": [
      "cullleaves-2.0.0+1.17.1-1.18.1.jar",
      "cullleaves-2.0.0+1.16.5.jar",
      "cullleaves-2.0.0+1.16.1.jar",
      "cullleaves-2.0.0+1.15.2.jar",
      "cullleaves-2.0.0+1.14.4.jar",
      "cullleaves-2.0.0+1.13.2.jar",
      "cullleaves-2.0.0+1.12.2.jar",
      "cullleaves-2.0.0+1.11.2.jar",
      "cullleaves-2.0.0+1.10.2.jar",
      "cullleaves-2.0.0+1.9.4.jar",
      "cullleaves-2.0.0+1.8.9.jar"
    ],
    "dynamicmenu": [
      "dynamicmenu-1.0.0+1.17.1-1.18.1.jar",
      "dynamicmenu-1.0.0+1.16.5.jar",
      "dynamicmenu-1.0.0+1.16.1.jar",
      "dynamicmenu-1.0.0+1.15.2.jar",
      "dynamicmenu-1.0.0+1.14.4.jar",
      "dynamicmenu-1.0.0+1.13.2.jar",
      "dynamicmenu-1.0.0+1.12.2.jar",
      "dynamicmenu-1.0.0+1.11.2.jar",
      "dynamicmenu-1.0.0+1.10.2.jar",
      "dynamicmenu-1.0.0+1.9.4.jar",
      "dynamicmenu-1.0.0+1.8.9.jar"
    ],
    "dynamicmenufps": [
      "dynamicmenufps-1.0.0+1.17.1-1.18.1.jar",
      "dynamicmenufps-1.0.0+1.16.5.jar",
      "dynamicmenufps-1.0.0+1.16.1.jar",
      "dynamicmenufps-1.0.0+1.15.2.jar",
      "dynamicmenufps-1.0.0+1.14.4.jar",
      "dynamicmenufps-1.0.0+1.13.2.jar",
      "dynamicmenufps-1.0.0+1.12.2.jar",
      "dynamicmenufps-1.0.0+1.11.2.jar",
      "dynamicmenufps-1.0.0+1.10.2.jar",
      "dynamicmenufps-1.0.0+1.9.4.jar",
      "dynamicmenufps-1.0.0+1.8.9.jar"
    ],
    "entityculling": [
      "entityculling-1.0.0+1.17.1-1.18.1.jar",
      "entityculling-1.0.0+1.16.5.jar",
      "entityculling-1.0.0+1.16.1.jar",
      "entityculling-1.0.0+1.15.2.jar",
      "entityculling-1.0.0+1.14.4.jar",
      "entityculling-1.0.0+1.13.2.jar",
      "entityculling-1.0.0+1.12.2.jar",
      "entityculling-1.0.0+1.11.2.jar",
      "entityculling-1.0.0+1.10.2.jar",
      "entityculling-1.0.0+1.9.4.jar",
      "entityculling-1.0.0+1.8.9.jar"
    ],
    "extraoptions": [
      "extraoptions-1.0.0+1.17.1-1.18.1.jar",
      "extraoptions-1.0.0+1.16.5.jar",
      "extraoptions-1.0.0+1.16.1.jar",
      "extraoptions-1.0.0+1.15.2.jar",
      "extraoptions-1.0.0+1.14.4.jar",
      "extraoptions-1.0.0+1.13.2.jar",
      "extraoptions-1.0.0+1.12.2.jar",
      "extraoptions-1.0.0+1.11.2.jar",
      "extraoptions-1.0.0+1.10.2.jar",
      "extraoptions-1.0.0+1.9.4.jar",
      "extraoptions-1.0.0+1.8.9.jar"
    ],
    "fastreset": ["fastreset-1.16.1-1.0.0.jar"],
    "forceportmod": ["forceportmod-1.16.1-1.0.0.jar"],
    "lazydfu": [
      "lazydfu-0.1.3+1.17.1-1.18.1.jar",
      "lazydfu-0.1.3+1.16.5.jar",
      "lazydfu-0.1.3+1.16.1.jar",
      "lazydfu-0.1.3+1.15.2.jar",
      "lazydfu-0.1.3+1.14.4.jar",
      "lazydfu-0.1.3+1.13.2.jar",
      "lazydfu-0.1.3+1.12.2.jar",
      "lazydfu-0.1.3+1.11.2.jar",
      "lazydfu-0.1.3+1.10.2.jar",
      "lazydfu-0.1.3+1.9.4.jar",
      "lazydfu-0.1.3+1.8.9.jar"
    ],
    "lithium": [
      "lithium-0.7.10+1.17.1-1.18.1.jar",
      "lithium-0.7.10+1.16.5.jar",
      "lithium-0.7.10+1.16.1.jar",
      "lithium-0.7.10+1.15.2.jar",
      "lithium-0.7.10+1.14.4.jar",
      "lithium-0.7.10+1.13.2.jar",
      "lithium-0.7.10+1.12.2.jar",
      "lithium-0.7.10+1.11.2.jar",
      "lithium-0.7.10+1.10.2.jar",
      "lithium-0.7.10+1.9.4.jar",
      "lithium-0.7.10+1.8.9.jar"
    ],
    "memoryleakfix": [
      "memoryleakfix-1.0.0+1.17.1-1.18.1.jar",
      "memoryleakfix-1.0.0+1.16.5.jar",
      "memoryleakfix-1.0.0+1.16.1.jar",
      "memoryleakfix-1.0.0+1.15.2.jar",
      "memoryleakfix-1.0.0+1.14.4.jar",
      "memoryleakfix-1.0.0+1.13.2.jar",
      "memoryleakfix-1.0.0+1.12.2.jar",
      "memoryleakfix-1.0.0+1.11.2.jar",
      "memoryleakfix-1.0.0+1.10.2.jar",
      "memoryleakfix-1.0.0+1.9.4.jar",
      "memoryleakfix-1.0.0+1.8.9.jar"
    ],
    "phosphor": [
      "phosphor-0.8.1+1.17.1-1.18.1.jar",
      "phosphor-0.8.1+1.16.5.jar",
      "phosphor-0.8.1+1.16.1.jar",
      "phosphor-0.8.1+1.15.2.jar",
      "phosphor-0.8.1+1.14.4.jar",
      "phosphor-0.8.1+1.13.2.jar",
      "phosphor-0.8.1+1.12.2.jar",
      "phosphor-0.8.1+1.11.2.jar",
      "phosphor-0.8.1+1.10.2.jar",
      "phosphor-0.8.1+1.9.4.jar",
      "phosphor-0.8.1+1.8.9.jar"
    ],
    "seedqueue": ["seedqueue-1.16.1-1.0.0.jar"],
    "setspawnmod": ["setspawnmod-1.16.1-1.0.0.jar"],
    "sodium": [
      "sodium-0.4.4+1.17.1-1.18.1.jar",
      "sodium-0.4.4+1.16.5.jar",
      "sodium-0.4.4+1.16.1.jar",
      "sodium-0.4.4+1.15.2.jar",
      "sodium-0.4.4+1.14.4.jar",
      "sodium-0.4.4+1.13.2.jar",
      "sodium-0.4.4+1.12.2.jar",
      "sodium-0.4.4+1.11.2.jar",
      "sodium-0.4.4+1.10.2.jar",
      "sodium-0.4.4+1.9.4.jar",
      "sodium-0.4.4+1.8.9.jar"
    ],
    "starlight": [
      "starlight-1.0.2+1.17.1-1.18.1.jar",
      "starlight-1.0.2+1.16.5.jar",
      "starlight-1.0.2+1.16.1.jar",
      "starlight-1.0.2+1.15.2.jar",
      "starlight-1.0.2+1.14.4.jar",
      "starlight-1.0.2+1.13.2.jar",
      "starlight-1.0.2+1.12.2.jar",
      "starlight-1.0.2+1.11.2.jar",
      "starlight-1.0.2+1.10.2.jar",
      "starlight-1.0.2+1.9.4.jar",
      "starlight-1.0.2+1.8.9.jar"
    ],
    "worldpreview": [
      "worldpreview-5.0.2+1.17.1.jar",
      "worldpreview-5.0.2+1.16.5.jar",
      "worldpreview-6.3.0+1.16.1.jar",
      "worldpreview-5.0.2+1.15.2.jar",
      "worldpreview-5.0.1+1.14.4.jar",
      "worldpreview-5.0.0+1.8.9.jar",
      "worldpreview-6.2.1+20w14infinite.jar"
    ],
    "z-buffer-fog": ["z-buffer-fog-1.4.1.jar"]
  };

  /**
   * ファイル名が指定されたModIDのパターンにマッチするかチェック
   */
  function matchesModPattern(fileName: string, modId: string): boolean {
    const patterns = MOD_ID_PATTERNS[modId];
    if (!patterns) return false;
    
    return patterns.some(pattern => {
      // ワイルドカードパターンの処理
      if (pattern.includes('*')) {
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(fileName);
      }
      
      // 完全一致
      return fileName === pattern;
    });
  }

  /**
   * インストールされているModをModIDで返す
   */
  async function getInstalledModIds(modsDir: string): Promise<Set<string>> {
    const localFiles = await getLocalModJars(modsDir);
    const installedModIds = new Set<string>();
    
    for (const fileName of localFiles) {
      for (const modId of Object.keys(MOD_ID_PATTERNS)) {
        if (matchesModPattern(fileName, modId)) {
          installedModIds.add(modId);
          break; // このファイルは既にマッチしたので次のファイルへ
        }
      }
    }
    
    return installedModIds;
  }

  /**
   * ファイル名からmodidとバージョンを解析（改善版）
   */
  function parseModFileName(fileName: string): { modid: string; version: string } | null {
    // 既知のModIDパターンと照合
    for (const [modId, patterns] of Object.entries(MOD_ID_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          // ワイルドカードパターンの処理
          const regexPattern = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.');
          const regex = new RegExp(`^${regexPattern}$`);
          if (regex.test(fileName)) {
            // バージョンを抽出
            const versionMatch = fileName.match(new RegExp(`${modId}-(.+)\\.jar`));
            if (versionMatch) {
              return { modid: modId, version: versionMatch[1] };
            }
          }
        } else if (fileName === pattern) {
          // 完全一致の場合
          const versionMatch = fileName.match(new RegExp(`${modId}-(.+)\\.jar`));
          if (versionMatch) {
            return { modid: modId, version: versionMatch[1] };
          }
        }
      }
    }
    
    // 既知のパターンにマッチしない場合は従来の方法で解析
    const nameWithoutExt = fileName.replace(/\.jar$/, '');
    const lastHyphenIndex = nameWithoutExt.lastIndexOf('-');
    if (lastHyphenIndex === -1) return null;
    
    const modid = nameWithoutExt.substring(0, lastHyphenIndex);
    const version = nameWithoutExt.substring(lastHyphenIndex + 1);
    
    return { modid, version };
  }

  /**
   * バージョン文字列を比較可能な形式に正規化
   */
  function normalizeVersion(version: string): string {
    // バージョン文字列を小文字に統一し、不要な文字を除去
    return version.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  }

  /**
   * 指定ディレクトリ内のjarファイル一覧を取得
   */
  async function getLocalModJars(modsDir: string): Promise<string[]> {
    if (!window.bafv4 || !window.bafv4.listFiles) {
      throw new Error('listFiles APIが利用できません');
    }
    const files: string[] = await window.bafv4.listFiles(modsDir);
    return files.filter(f => f.endsWith('.jar'));
  }

  /**
   * modsDir内のModをavailableItemsと比較し、新バージョンがあればダウンロードして置き換える（改善版）
   */
  async function updateModsFolder(modsDir: string) {
    const localFiles = await getLocalModJars(modsDir);
    
    for (const mod of availableItems.value) {
      // ローカルファイルから同じmodidのファイルを探す
      const localModFile = localFiles.find(fileName => {
        return matchesModPattern(fileName, mod.id);
      });

      if (localModFile) {
        const parsed = parseModFileName(localModFile);
        if (parsed) {
          const localVersion = normalizeVersion(parsed.version);
          const remoteVersion = normalizeVersion(mod.version || '');
          
          // バージョンが異なる場合のみ更新
          if (localVersion !== remoteVersion) {
            console.log(`Updating ${mod.id}: ${parsed.version} -> ${mod.version}`);
            
            // 既存ファイルを削除
            if (window.bafv4.removeFile) {
              await window.bafv4.removeFile(`${modsDir}/${localModFile}`);
            }
            
            // 新しいバージョンをダウンロード
            const url = mod.options[0]?.url;
            if (url && window.bafv4.downloadFile) {
              const expectedName = `${mod.id}-${mod.version || 'unknown'}.jar`;
              await window.bafv4.downloadFile(url, `${modsDir}/${expectedName}`);
            }
          }
        }
      } else {
        // ローカルにファイルが存在しない場合、新規ダウンロード
        console.log(`Downloading new mod: ${mod.id} ${mod.version}`);
        const url = mod.options[0]?.url;
        if (url && window.bafv4.downloadFile) {
          const expectedName = `${mod.id}-${mod.version || 'unknown'}.jar`;
          await window.bafv4.downloadFile(url, `${modsDir}/${expectedName}`);
        }
      }
    }
  }

  return {
    isLoading,
    isDownloading,
    availableItems,
    selectedItems,
    selectedOptions,
    translatedDescriptions,
    selectedFilter,
    mcsrRankedMod,
    filters,
    fetchMods,
    filteredItems,
    onChangeOptions,
    startDownload,
    percent,
    state,
    selectAllRecommended,
    updateModsFolder,
    getLocalModJars,
    getInstalledModIds,
  };
} 