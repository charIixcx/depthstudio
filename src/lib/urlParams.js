// URL Parameter encoding/decoding for sharing settings
import { levaStore } from 'leva';

export const encodeSettings = () => {
  try {
    const state = levaStore.getData();
    const compressed = JSON.stringify(state);
    return btoa(compressed);
  } catch (err) {
    console.error('Failed to encode settings:', err);
    return null;
  }
};

export const decodeSettings = (encoded) => {
  try {
    const decompressed = atob(encoded);
    return JSON.parse(decompressed);
  } catch (err) {
    console.error('Failed to decode settings:', err);
    return null;
  }
};

export const getSettingsFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('preset');
  if (encoded) {
    return decodeSettings(encoded);
  }
  return null;
};

export const setSettingsToURL = (settings) => {
  const encoded = encodeSettings();
  if (encoded) {
    const url = new URL(window.location);
    url.searchParams.set('preset', encoded);
    window.history.pushState({}, '', url);
    return url.toString();
  }
  return null;
};

export const copySettingsURL = async () => {
  const url = setSettingsToURL();
  if (url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.error('Failed to copy URL:', err);
      return false;
    }
  }
  return false;
};
