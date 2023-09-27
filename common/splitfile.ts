import React, { useEffect } from "react";
import axios from "axios";

const workerEndpoint = "https://cloudflare.usman-bestdev.workers.dev/";
const partSize = 10 * 1024 * 1024; // 1MB

const uploadFile = async (selectedFile: File) => {
  const url = `${workerEndpoint}${selectedFile.name}`;
  // Create the multipart upload
  const createResponse = await axios.post(
    `${url}?action=mpu-create`,
    null
    // {
    //   headers: {
    //     "Access-Control-Allow-Origin": "*",
    //     "Access-Control-Allow-Headers": "*",
    //   },
    // }
  );

  const uploadId: string = createResponse.data.uploadId;

  const partCount: number = Math.ceil(selectedFile.size / partSize);

  const uploadedParts = await Promise.all(
    Array.from({ length: partCount }, (_, index) =>
      uploadPart(selectedFile, partSize, url, uploadId, index)
    )
  );

  // Complete the multipart upload
  const completeResponse = await axios.post(
    `${url}?action=mpu-complete&uploadId=${uploadId}`,
    {
      parts: uploadedParts,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
      },
    }
  );

  if (completeResponse.status === 200) {
    console.log("🎉 Successfully completed multipart upload");
  } else {
    console.error(completeResponse.data);
  }
};

const uploadPart = async (
  file: File,
  partSize: number,
  url: string,
  uploadId: string,
  index: number
) => {
  console.log(`Uploading part ${index}`);
  const part = await readPartOfFile(file, partSize, index);

  // Upload the part
  const response = await axios.put(
    `${url}?action=mpu-uploadpart&uploadId=${uploadId}&partNumber=${index + 1}`,
    part,
    {
      headers: {
        "Content-Type": file.type,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
      },
    }
  );

  return response.data;
};

const readPartOfFile = async (file: File, partSize: number, index: number) => {
  const start = partSize * index;
  const end = start + partSize;

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        resolve(event.target.result);
      } else {
        reject(new Error("Failed to read file part as ArrayBuffer"));
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    // const blob = new Blob([file.slice(start, end)]); // need to test with blob later
    reader.readAsArrayBuffer(file.slice(start, end));
  });
};

export default uploadFile;
