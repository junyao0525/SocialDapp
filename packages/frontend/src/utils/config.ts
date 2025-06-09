"server only"

import { PinataSDK } from "pinata"


export const pinata = new PinataSDK({
  pinataJwt: `${process.env.PINATA_JWT_SECRET}`,
  pinataGateway: `${process.env.GATEWAY_URL}`
})