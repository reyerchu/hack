export default function HomeAbout() {
  return (
    <section className="md:p-12 p-6 text-complementary">
      <h1 className="md:text-4xl text-2xl font-bold my-4">關於黑客台灣</h1> {/* !change */}
      <div className="md:text-base text-sm">
        黑客台灣是一個使用者友善的黑客松活動管理平台。
        <br />
        <br />
        其主要功能包括：完全可自訂的前端介面、支援電子郵件/Google
        登入、參與者註冊、圖片管理、挑戰任務、贊助商展示、FAQ
        等後端資料擷取、推播通知、突顯正在進行中活動的輪播功能、QR
        碼簽到和商品領取、報告提交/問答功能、內建且易於設定的時程表、黑客、管理員和超級管理員角色權限、管理員控制台可發送公告、更新使用者角色、顯示簽到次數、商品領取統計等功能！
        <br />
        <br />
        若要為您的黑客松設定黑客台灣，請參閱{' '}
        <a
          href="https://github.com/acmutd/hackportal/blob/develop/docs/set-up.md"
          className="underline"
        >
          HackPortal Github
        </a>
        ！
      </div>
    </section>
  );
}
