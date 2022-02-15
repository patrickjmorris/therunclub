import { getChannelInfo } from "lib/youtube";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export default function Home({ channelInfos }) {
    return (
      <div className="max-w-6xl p-4 mx-auto lg:p-8 bg-slate-50">
        <h1>Best Running YouTube Channels</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {channelInfos.map((channelInfo) => {
            const {
              id,
              snippet: { title, thumbnails, publishedAt },
            } = channelInfo.items[0];
  
            return (
              <Link key={id} href={`/videos/channel/${id}`}>
                <a className="rounded-lg">
                <Image
                src={thumbnails.medium?.url}
                height={thumbnails.medium?.height}
                width={thumbnails.medium?.width}
                className="rounded-md shadow-lg"
                />
                  <div className="mt-2 text-sm font-medium">
                    {title}
                  </div>
                  <div>{format(new Date(publishedAt), "PPP")}</div>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

export async function getServerSideProps() {
  const channels = [
    'UCDFbc3BvaSiOhMa4Y-BiwTA',
    'UC2-2J_y_jpOYz8Rld5C6C5w',
    'UCZPqG0yh_xPm2AyLjffbDvw',
    'UCJIo5flfEJKSQ79zINvqPQg',
    'UCjyDlyHPHLhcIT8ov53d5qg',
    'UCgAYWS3ldZMhsBpXi6kn2Yw',
    'UC6y_DbpezOinlzHv8O092zw',
    'UCpUtRsyAx5rluUDmF4k_gHw',
    'UC1Fp52XJH8UKaa_gHMZrckw',
    'UCNQaItQ0LLVu5987SD88s2w',
    'UCWPzT9H7dH5i7FaI9-BuUmA',
    'UCe43pe3w4L6w3tNMRkWiJBA',
    'UCX7MXflg3DxDJTZi5mJRiOw',
    'UCGMbTnk82pK0vmITB5LtiPw',
    'UCh8p7jHeMux6XnBRaqhlYWA',
    'UCcKqyeT52O1XUHaHeSRt7kw',
    'UC3vFznWAkGITMT2clmgwOaA',
    'UCJTTFnzwO5qUUCPkIX_nRow',
    'UCeSHo5kTvzoik4STh7MuMCA',
    'UCCU2xPv2G9Jw5Qg4jMSx1Wg',
    'UCOBM9FasII4dKbyE_HKkbjw',
    'UCo5TE6wpU50kREWVbRdKnOQ',
    'UCQk7fWv15ChjMJLCRVmtApw',
    'UCAbGmxSxIw-JS9RumJkKQhw',
    'UC_d8BpVEAevlcHBoyqj6N8Q',
    'UC0PgYMqwlmR_4S73M8tu0lA',
    'UC2xCiwFqaYTmweSJ7p2UzcA',
    'UC6ExRKJw1olM9Z_Vd0ceTbA',
    'UCa2vGJcdOPwY0vIJR346eIw',
    'UCbeZCF2JP03CT_24UtU0q0Q',
    'UCc6gzn4es_HE0RgcHEcf63Q',
    'UCcPagJur6wcbV5kej6mwG_A',
    'UCFe2g1SrVD7OEzlsta23X7g',
    'UCFjeE9rU50uZFJbfWxPKcGw',
    'UCFYpwqeNXx7M9xosFjdm5kQ',
    'UCh_w_vLvlZNBeTAP8qaWhoA',
    'UCharhoGUUajCcKgKD05ZFDg',
    'UCJ9i30yMclSeBacaB9Jd0eg',
    'UCjleCUWE3llQSGBrBNkcM-Q',
    'UCjlFx_DlmMcNSD5bE2WRY4w',
    'UCJumOlRn9C592ijW9sUC2Hg',
    'UCkV0HYbZk55q1kLNhQ8tMQg',
    'UCKznTh94zhbKkeRf1hxBrfA',
    'UCMM4CgGZeqFGXyfHjvPhklA',
    'UCmNQyHOOP_34Grcp8_KbLvQ',
    'UCn67RpOfpZk0a8ZPpBNgMsg',
    'UCnI3TuOg8D3SCRPW8ET4EAg',
    'UCNKMpnM_Yvf6E-Hhf9btYqA',
    'UCnpMw-hkLCWeYDnQZw5mluQ',
    'UCp21zu_8Hd0w9HULooemRCA',
    'UCpg3mLzl274F5LaOx99N0Zw',
    'UCpmI8opIXGIODYql3ClvxYQ',
    'UCshUvA06neNd-xPg7k5EXAQ',
    'UCTVjyeSlm3sR3N1fx-NI-Kw',
    'UCTxG34nhYtkLW8jh2Su9Y7w',
    'UCu8hTm_tO4Z9TITnbW6zfTA',
    'UCUwGYfvGvmqMnvQTOY8E_qg',
    'UCX7dV4OPDSutwMUauSD5AAA',
    'UCXVX_0ukCPMLPWk64KYnHFA',
    'UCScHdYFS_KBduqkRBjbQNuA',
    'UC4B2YgFex2nERrQDuuCR0Zw',
    'UCRnD_B4xWEBivdTS4IR3Owg',
    'UCx2Xqm8S3Ghqn5puhSKWH4Q',
    'UCSxqXJj9btSS3nrmBg8GXdQ',
    'UCjGZ6D8hJFvLur5K_p9vKAA'
  ];

  const channelInfos = await Promise.all(
    channels.map((channelId) => getChannelInfo(channelId))
  );

  // console.log(JSON.stringify(channelInfos, null, 2));

  return {
    props: {
      channelInfos,
    },
  };
}