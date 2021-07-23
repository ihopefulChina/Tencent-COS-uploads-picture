
import { genID, get_suffix } from '~/tools/tools';
import { autobind } from 'core-decorators';
import COS from 'cos-js-sdk-v5';

const Bucket = 'zhiwuguanjia-1306067897';
const Region = 'ap-beijing';


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