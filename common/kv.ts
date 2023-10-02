import axios from "axios";
import { workerEndpoint } from "./splitfile";

const url = `https://cloudflare.usman-bestdev.workers.dev`;
export const getList = async () => {
  return await axios.get(`${url}?action=list`);
};

export const postList = async (file: string) => {
  return await axios.post(`${url}?action=upload-kv&file=${file}`, { file });
};
