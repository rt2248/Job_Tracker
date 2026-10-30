import React from "react"
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../shared/Modal"
import Button from "../shared/Button"

const UnsavedChangesModal = ({ isOpen, onConfirmDiscard, onCancel }) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    size="sm"
    closeOnOverlayClick={true}
  >
    <ModalHeader className="justify-center text-center">
      <ModalTitle className="text-center text-lg sm:text-xl text-ink font-display">
        Discard unsaved changes?
      </ModalTitle>
    </ModalHeader>
    <ModalContent>
      <p className="text-sm text-ink-secondary font-sans leading-relaxed text-center">
        You have modified your profile settings. If you leave or cancel now, your unsaved edits will be discarded.
      </p>
    </ModalContent>
    <ModalFooter className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle mt-4">
      <Button
        variant="secondary"
        size="sm"
        onClick={onCancel}
      >
        Keep Editing
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onConfirmDiscard}
      >
        Discard Changes
      </Button>
    </ModalFooter>
  </Modal>
)

export default UnsavedChangesModal
