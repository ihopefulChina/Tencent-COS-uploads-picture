/* 组件 -- 上传 */
import React, { useState } from "react";

import WxImageViewer from "react-wx-images-viewer";
import { uploadFiles } from "~/components/tencent";
import { Toast } from "antd-mobile";
import Compressor from "compressorjs";

import styles from "./index.module.less";

interface IProps {
  imgList?: string[];
  onChange: (list: string[]) => void;
  onDelete: (idx: number) => void;
  progressChange?: (percent: number) => void;
  count?: number;
}

const Index = ({ imgList = [], onChange, onDelete, count = 2 }: IProps) => {
  const [showViewer, setShowViewer] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;

    if (imgList.length < count) {
      //代表还可以上传
      if (fileList && fileList.length > 0) {
        const newFileList = [] as any;
        for (const key in fileList) {
          if (Object.prototype.hasOwnProperty.call(fileList, key)) {
            const element = fileList[key] as any;
            element && newFileList.push(element);
          }
        }
        let paths = [];
        if (imgList.length + newFileList.length < count) {
          paths = newFileList;
        } else {
          //数量超过了
          const surplus = count - imgList.length;
          paths = newFileList.slice(0, surplus);
          // paths = newFileList.filter((item, index) => index < surplus);
        }
        Toast.loading("上传中...");
        //压缩图片
        const newPaths = paths.map((image: any) => {
          let newImg = image;
          new Compressor(image, {
            quality: 0.2, // 0.6 can also be used, but its not recommended to go below.
            success: (res) => (newImg = res),
          });
          return newImg;
        });
        // const oldImgs = newPaths.map((fileObject: any) => {
        //   const file = fileObject.file ? fileObject.file : fileObject;
        //   return file.path;
        // });
        // console.log(oldImgs);
        // onChange && onChange([...imgList, ...newPaths]);
        await uploadFiles(newPaths).then((res: any) => {
          onChange && onChange([...imgList, ...res]);
        });
        Toast.hide();
      }
    }
  };

  return (
    <div className={styles.upload}>
      <div className={styles.uploadList}>
        {imgList.map((item, index) => (
          <div
            key={`${item}`}
            className={styles.item}
            onClick={(event) => {
              event.stopPropagation();
              setShowViewer(true);
              setImgIndex(index);
              document
                .getElementsByTagName("body")[0]
                .setAttribute("style", "overflow:hidden"); //给body添加overflow:hidden阻止遮罩层滚动主页面滚动
            }}
          >
            <img
              className={styles.img}
              data-preview-proto={item}
              src={item}
              alt="上传图片"
            />
            <img
              className={styles.del}
              src={require("./images/del.png")}
              alt="删除按钮"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(index);
              }}
            />
          </div>
        ))}

        {imgList.length < count && (
          <div className={styles.uploadBtn}>
            <input
              type="file"
              name="image"
              accept="image/*"
              multiple={true}
              className={styles.uploadInput}
              onChange={onInputChange}
            />
            <div className={styles.uploadPlus}>
              <img src={require("./images/plus.png")} alt="加号" />
              <span>
                ({imgList.length}/{count})
              </span>
            </div>
          </div>
        )}
      </div>
      {showViewer ? (
        <WxImageViewer
          onClose={() => {
            setShowViewer(false);
            document.getElementsByTagName("body")[0].removeAttribute("style");
          }}
          urls={imgList}
          index={imgIndex}
        />
      ) : (
        ""
      )}
    </div>
  );
};
export default Index;
