import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useCallback, Fragment } from "react";
import Cookies from "js-cookie";
import { Popover, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Layout({ meta, children }) {
  const [scrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    setScrolled(window.pageYOffset > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const [closeModal, setCloseModal] = useState(Cookies.get("closeModal"));

  useEffect(() => {
    if (closeModal) {
      Cookies.set("closeModal", true);
    } else {
      Cookies.remove("closeModal");
    }
  }, [closeModal]);

  const navigation = [
    { name: 'Podcasts', href: '/podcasts' },
    { name: 'About', href: '/about' },
  ]
  
  return (
    <div>
      <Head>
        <title>{meta?.title}</title>
        {/* <link rel="icon" href="/favicon.png" /> */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏃</text></svg>" />
        <link rel="shortcut icon" type="image/x-icon" href={meta?.logo} />
        <link rel="apple-touch-icon" sizes="180x180" href={meta?.logo} />
        <meta name="theme-color" content="#7b46f6" />

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta itemProp="name" content={meta?.title} />
        <meta itemProp="description" content={meta?.description} />
        <meta itemProp="image" content={meta?.ogImage} />
        <meta name="description" content={meta?.description} />
        <meta property="og:title" content={meta?.title} />
        <meta property="og:description" content={meta?.description} />
        <meta property="og:url" content={meta?.ogUrl} />
        <meta property="og:image" content={meta?.ogImage} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@TheRunClub_xyz" />
        <meta name="twitter:creator" content="@TheRunClub_xyz" />
        <meta name="twitter:title" content={meta?.title} />
        <meta name="twitter:description" content={meta?.description} />
        <meta name="twitter:image" content={meta?.ogImage} />
      </Head>
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Popover as="header" className="relative">
            <div className="py-6 bg-gray-900">
              <nav
                className="relative flex items-center justify-between px-4 mx-auto max-w-7xl sm:px-6"
                aria-label="Global"
              >
                <div className="flex items-center flex-1">
                  <div className="flex items-center justify-between w-full md:w-auto">
                  <Link href="/">
                      <span className="sr-only">The Run Club</span>
                      <img
                        className="w-auto h-8 sm:h-10"
                        src="https://tailwindui.com/img/logos/workflow-mark-teal-200-cyan-400.svg"
                        alt=""
                      />
                    </Link>
                    <div className="flex items-center -mr-2 md:hidden">
                      <Popover.Button className="inline-flex items-center justify-center p-2 text-gray-400 bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus-ring-inset focus:ring-white">
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon className="w-6 h-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                  <div className="hidden space-x-8 md:flex md:ml-10">
                    {navigation.map((item) => (
                      <Link href={item.href} key={item.name} className="text-base font-medium text-white hover:text-gray-300">
                          {item.name}
                      </Link>  
                    ))}
                  </div>
                </div>
                
              </nav>
            </div>

            <Transition
              as={Fragment}
              enter="duration-150 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-100 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Popover.Panel focus className="absolute inset-x-0 top-0 p-2 transition origin-top transform md:hidden">
                <div className="overflow-hidden bg-white rounded-lg shadow-md ring-1 ring-black ring-opacity-5">
                  <div className="flex items-center justify-between px-5 pt-4">
                    <div>
                      <img
                        className="w-auto h-8"
                        src="https://tailwindui.com/img/logos/workflow-mark-teal-500-cyan-600.svg"
                        alt=""
                      />
                    </div>
                    <div className="-mr-2">
                      <Popover.Button className="inline-flex items-center justify-center p-2 text-gray-400 bg-white rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-600">
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                  <div className="pt-5 pb-6">
                    <div className="px-2 space-y-1">
                      {navigation.map((item) => (
                        <Link key={item.name} href={item.href}  className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50">
                            {item.name}
                        </Link>
                      ))}
                    </div>
                    <div className="px-5 mt-6">
                      <Link
                        href="#"
                        className="block w-full px-4 py-3 font-medium text-center text-white rounded-md shadow bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                      >
                        Sign up
                      </Link>
                    </div>
                    <div className="px-5 mt-6">
                      <p className="text-base font-medium text-center text-gray-500">
                        Existing customer?{' '}
                        <Link href="#" className="text-gray-900 hover:underline">
                          Login
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

      <div>{children}</div>
      </div>
      </div>
    </div>
  );
}
