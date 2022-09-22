import Dropzone from "@/components/Dropzone";
import Layout from "@/components/layout/Layout";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

import path from "path";
import React, { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { FileWithPath } from "react-dropzone";

const ffmpeg = createFFmpeg({
  log: true,
  corePath: "./ffmpeg-core/dist/ffmpeg-core.js",
  // corePath: "./node_modules/@ffmpeg/core/ffmpeg-core.js",
});

type AudioFile = {
  name: string;
  size: string;
  blobUrl: string;
};

function Index() {
  const [ready, setReady] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [converting, setConverting] = useState(false);
  const [truePeak, setTruePeak] = useState<number>(-9); // TP	최대 실제 피크(True Peak.)의 dBFS	-9.0~0.0	-2.0
  const [measured_I, setMeasured_I] = useState<number>(-20); // measured_I	측정된 I(평균 볼륨) 값	-99.0~0.0	-
  const [measured_LRA, setMeasure_LRA] = useState<number>(18.06); // measured_LRA	측정된 LRA(볼륨 범위) 값	0.0~99.0	-
  const [measured_TP, setMeasured_TP] = useState<number>(-4.47); // measured_TP	측정된 TP(최대 실제 피크) 값	-99.0~99.0	-
  const [measured_thresh, setMeasured_thresh] = useState<number>(-39.20); // measured_thresh	측정된 임곗값(threshold)	-99.0~0.0	-
  const [offset, setOffset] = useState<number>(0.58); //	오프셋 이득(gain)	-99.0~99.0	0.0
  //  I	평균(integrated) 볼륨	-70.0~-5.0	-24.0
  // LRA	볼륨 범위	1.0~20.0	7.0

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };
  useEffect(() => {
    if (isMobile) {
      setReady(true);
      return;
    } else {
      load().catch((er) => console.log(er));
    }
  }, []);

  const convertToMp3 = async (video: FileWithPath) => {
    const ext = path.extname(video.name);
    // Write the file to memory
    ffmpeg.FS("writeFile", `input${ext}`, await fetchFile(video));
    // Run the FFmpeg command

    setConverting(true);
    await ffmpeg.run("-i", `input${ext}`, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-");
    // await ffmpeg.run("-i", `input${ext}`, "-vn", "-acodec", "copy", "out.aac");
    // await ffmpeg.run("-i", `input${ext}`, "-q:a", "0", "-map", "a", "out.mp3");
    await ffmpeg.run(
      "-i",
      `input${ext}`,
      "-af",
      "loudnorm=I=-20:TP=" +
        truePeak +
        ":LRA=11:measured_I="+measured_I+":measured_LRA="+measured_LRA+":measured_TP="+measured_TP+":measured_thresh="+measured_thresh+":offset="+offset+":linear=true:print_format=json",
      "out.mp3"
    );

  
    const data = ffmpeg.FS("readFile", "out.mp3");
    ffmpeg.FS("unlink", "out.mp3");
    const name = video.name.replace(/\.[^/.]+$/, "");
    const size = (data.length / 1024 / 1024).toFixed(1) + "MB";

    const blobUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "audio/mpeg" })
    );

    setConverting(false);
    setAudioFiles([...audioFiles, { blobUrl, name, size }]);
  };

  return (
    <Layout type="Audio">
      <div className="w-full flex-col gap-10 mb-3">
        <p>TP 최대 실제 피크(True Peak.)의 dBFS -9.0~0.0 -2.0</p>
        <input
          className="w-full border-2"
          type="number"
          value={truePeak}
          onChange={(e) => setTruePeak(e.target.valueAsNumber)}
        />
      </div>
      <div className="w-full flex-col gap-10 mb-3">
        <p> measured_I 측정된 I(평균 볼륨) 값 -99.0~0.0 -</p>
        <input
          className="w-full border-2"
          type="number"
          value={measured_I}
          onChange={(e) => setMeasured_I(e.target.valueAsNumber)}
        />
      </div>
      <div className="w-full flex-col gap-10 mb-3">
        <p>measured_LRA	측정된 LRA(볼륨 범위) 값	0.0~99.0	-</p>
        <input
          className="w-full border-2"
          type="number"
          value={measured_LRA}
          onChange={(e) => setMeasure_LRA(e.target.valueAsNumber)}
        />
      </div>
      <div className="w-full flex-col gap-10 mb-3">
        <p> measured_TP	측정된 TP(최대 실제 피크) 값	-99.0~99.0 -</p>
        <input
          className="w-full border-2"
          type="number"
          value={measured_TP}
          onChange={(e) => setMeasured_TP(e.target.valueAsNumber)}
        />
      </div>

      <div className="w-full flex-col gap-10 mb-3">
        <p>measured_thresh	측정된 임곗값(threshold)	-99.0~0.0	-</p>
        <input
          className="w-full border-2"
          type="number"
          value={measured_thresh}
          onChange={(e) => setMeasured_thresh(e.target.valueAsNumber)}
        />
      </div>
      
      <div className="w-full flex-col gap-10 mb-3">
        <p>오프셋 이득(gain)	-99.0~99.0	0.0</p>
        <input
          className="w-full border-2"
          type="number"
          value={offset}
          onChange={(e) => setOffset(e.target.valueAsNumber)}
        />
      </div>
      <Dropzone
        convertFile={convertToMp3}
        ready={ready}
        converting={converting}
      />

      <button
        className="w-full my-4 py-2 bg-gray-50 transition ease-in dark:bg-gray-900 dark:hover:border-gray-400"
        onClick={() => {
          if (audioFiles.length !== 0) setAudioFiles([]);
        }}
      >
        {converting
          ? "Converting..."
          : audioFiles.length !== 0
          ? "Clear"
          : "Output"}
      </button>

      {audioFiles &&
        audioFiles?.map((a, i) => {
          return (
            <div key={i} className="bg-white shadow dark:bg-black ">
              <a
                href={a.blobUrl}
                download={a.name}
                className="flex text-md justify-between px-4 font-medium py-2 text-left transition border border-gray-200 dark:border-gray-600 dark:hover:border-gray-400 hover:border-gray-400  cursor-pointer"
              >
                <span>
                  {a.name.length > 20
                    ? a.name.substring(0, 20) + "..."
                    : a.name}
                </span>
                <span> {a.size}</span>
              </a>
              <audio
                controls
                style={{
                  height: "1.5rem",
                  width: "100%",
                }}
              >
                <source src={a.blobUrl} type="audio/mpeg" />
              </audio>
            </div>
          );
        })}
    </Layout>
  );
}

export default Index;
