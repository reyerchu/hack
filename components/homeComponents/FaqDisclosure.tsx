import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/solid';

/**
 *
 * Represents props used by FaqDisclosure component
 *
 * @param question a frequently asked question
 * @param answer answer to corresponding question
 * @param isOpen boolean variable used to determine whether the disclosure should be open or not
 * @param toggleDisclosure function to call when user wants to open/close disclosure
 *
 */
interface FaqDisclosureProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleDisclosure: () => void;
}

/**
 *
 * Component representing a FAQ question in /about/faq
 *
 */
export default function FaqDisclosure({
  question,
  answer,
  isOpen,
  toggleDisclosure,
}: FaqDisclosureProps) {
  return (
    <Disclosure>
      <div className="transition duration-300 ease-in-out">
        <Disclosure.Button
          className={`p-5 text-gray-900 font-semibold text-left text-base md:text-lg w-full ${
            isOpen ? 'border-b border-gray-100' : ''
          }`}
          as="div"
        >
          <button
            className="w-full flex flex-row justify-between items-center gap-4"
            onClick={() => {
              toggleDisclosure();
            }}
          >
            <span className="text-left flex-1">{question}</span>
            <ChevronDownIcon
              className={`${
                isOpen
                  ? 'transform rotate-180 transition duration-300 ease-in-out'
                  : 'transition duration-300 ease-in-out'
              } w-5 h-5 flex-shrink-0 text-gray-400`}
            />
          </button>
        </Disclosure.Button>

        <Transition
          show={isOpen}
          enter="transition duration-200 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-150 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Disclosure.Panel
            className="px-5 pt-3 pb-5 text-gray-600 text-left text-sm md:text-base whitespace-pre-line leading-relaxed"
            static
          >
            {answer}
          </Disclosure.Panel>
        </Transition>
      </div>
    </Disclosure>
  );
}
