import COSUpload from './config';
import { get } from "~/request";
import { tencentOssTokenUrl } from '~/config';

const { uploadFiles } = new COSUpload({
  getOssToken: () => get(tencentOssTokenUrl)
});

export { uploadFiles };