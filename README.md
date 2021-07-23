cos-js-sdk-v5 封装 适用于微信浏览器 H5 环境

文档地址：[https://ihopefulchina.github.io/oi4CnmXh7/](https://ihopefulchina.github.io/oi4CnmXh7/)

### config.ts

```
import { genID, get_suffix } from '~/tools/tools';
import { autobind } from 'core-decorators';
import COS from 'cos-js-sdk-v5';

const Bucket = 'Bucket值';
const Region = 'Region值';

@autobind
export default class COSUpload {
  private getOssToken: () => Promise<any>

  constructor(config: {
    getOssToken: () => Promise<any>
  }) {
    this.getOssToken = config.getOssToken;
  }

  /**
   * 批量上传
   * @param {Object} obj Bucket、Region、Body 详情查看cos文档
   * @returns err || 批量上传filesData
   */
  uploadFiles(fileList: any) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const { cos, content } = await this.getOss();
      const files = await fileList.map((fileObject: any) => {
        const file = fileObject.file ? fileObject.file : fileObject;
        const fileName = `${content.requestId}${genID(3)}.${file.path ? get_suffix(file.path) : 'png'}`;
        return {
          Bucket: Bucket,
          Region: Region,
          Key: fileName,
          StorageClass: 'STANDARD',
          Body: file,
        };
      });
      await cos.uploadFiles({
        files,
        SliceSize: 1024 * 1024 * 5,    /* 设置大于5MB采用分块上传 */
      }, function (err: any, data: any) {
        const val = (err || data);
        const list = !err ? val.files.map((item: any) => `https://${item.data.Location}`
        ) : [];
        const newArr = list.filter((it: string) => it);
        return err ? reject(err) : resolve(newArr);
      });
    });
  }


  private async getOss() {
    const data = await this.getOssToken();
    const content = data as any;
    const credentials = data.credentials;
    // console.log(window,wx);
    const cos = new COS({
      getAuthorization: function (options: any, callback: any) {
        callback({
          TmpSecretId: credentials.tmpSecretId,
          TmpSecretKey: credentials.tmpSecretKey,
          SecurityToken: credentials.sessionToken,
          // 建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
          StartTime: data.startTime, // 时间戳，单位秒，如：1580000000
          ExpiredTime: data.expiredTime, // 时间戳，单位秒，如：1580000900
        });
      }
    });

    return {
      cos,
      content
    };
  }
}
```

### index.ts

```
import COSUpload from './config';
import { get } from "~/request";

<!-- get请求 -->
const { uploadFiles } = new COSUpload({
  getOssToken: () => get(`xxx.com/tencent/cos-token`)
});

export { uploadFiles };
```

### 引入文件内容

```
/**
 * @description: 生成唯一id
 * @param {number} length 数字长度
 * @return {string}
 */
export function genID(length = 3) {
    return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
}

//获取文件名称后缀
export const get_suffix = (fileName: string) => {
    const suffix = fileName.substring(fileName.lastIndexOf('.') + 1);
    return suffix;
};

```

### 上传多张图片组件

```
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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        //压缩图片
        const newPaths = paths.map((image: any) => {
          let newImg = image;
          new Compressor(image, {
            quality: 0.5, // 0.6 can also be used, but its not recommended to go below.
            success: (res) => (newImg = res),
          });
          return newImg;
        });
        Toast.loading("上传中...");
        uploadFiles(newPaths).then((res: any) => {
          onChange && onChange([...imgList, ...res]);
          Toast.hide();
        });
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
```

### 引用组件

```
import Upload from "~/components/upload";
<Upload
                  imgList={form.discoverServiceImgs}
                  count={6}
                  onChange={(imgs) =>
                    setForm({ ...form, discoverServiceImgs: imgs })
                  }
                  onDelete={(idx) =>
                    setForm({
                      ...form,
                      discoverServiceImgs: form.discoverServiceImgs.filter(
                        (_value: any, _index: any) => _index !== idx
                      ),
                    })
                  }
                />

```
