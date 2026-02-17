import Swal from 'sweetalert2'

// Custom theme that respects dark mode
const getTheme = () => {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  }
}

// Success alert
export const showSuccess = (message, title = 'Success!') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    ...getTheme(),
  })
}

// Error alert
export const showError = (message, title = 'Error!') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK',
    ...getTheme(),
  })
}

// Info alert
export const showInfo = (message, title = 'Info') => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'OK',
    ...getTheme(),
  })
}

// Warning alert
export const showWarning = (message, title = 'Warning!') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'OK',
    ...getTheme(),
  })
}

// Confirmation dialog
export const showConfirm = (message, title = 'Are you sure?') => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    ...getTheme(),
  })
}

// Delete confirmation
export const showDeleteConfirm = (itemName = 'this item') => {
  return Swal.fire({
    icon: 'warning',
    title: 'Delete Confirmation',
    text: `Are you sure you want to delete ${itemName}?`,
    html: `
      <p>Are you sure you want to delete <strong>${itemName}</strong>?</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">This action cannot be undone.</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ef4444',
    reverseButtons: true,
    ...getTheme(),
  })
}

// Loading alert
export const showLoading = (message = 'Processing...') => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading()
    },
    ...getTheme(),
  })
}

// Toast notification
export const showToast = (message, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
    ...getTheme(),
  })

  return Toast.fire({
    icon,
    title: message,
  })
}

// Custom HTML alert
export const showCustom = (options) => {
  return Swal.fire({
    ...getTheme(),
    ...options,
  })
}
