import Link from 'next/link';
import NavLink from '../NavLink';
import { useEffect } from 'react';

/**
 * A dashboard header.
 */
export default function DashboardHeader() {
  useEffect(() => {
    accordion();
  }, []);

  const accordion = () => {
    let acc = document.getElementsByClassName('accordion');
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener('click', function () {
        this.classList.toggle('menuactive');
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    }
  };

  return (
    <section>
      <header className="md:inline hidden justify-center py-2 md:p-4 items-center">
        <div className="mx-auto flex flex-wrap justify-center lg:text-xl text-lg font-header text-center">
          <NavLink href="/dashboard" exact={true} className="mx-4">
            黑客中心
          </NavLink>
          <NavLink href="/dashboard/questions" exact={true} className="mx-4">
            提出問題
          </NavLink>
        </div>
      </header>
      <div className="my-4 md:hidden ">
        <button className="accordion text-left p-2 text-sm bg-primary text-secondary">
          儀表板選單
        </button>
        <div className="panel w-full bg-secondaryDark text-primaryDark text-sm">
          <ul className="">
            <li className="p-2 hover:bg-secondary cursor-pointer">
              <Link href="/dashboard">黑客中心</Link>
            </li>
            <li className="p-2 hover:bg-secondary cursor-pointer">
              <Link href="/dashboard/questions">提出問題</Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
