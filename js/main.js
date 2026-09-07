/* ============================================================================
WEDDING WEBSITE - MAIN SCRIPT (jQuery)
============================================================================ */
$.easing.easeInOutCubic = function (x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

$(function () {
    /* --------------------------------------------------------------------------
        SMOOTH SCROLL NAVIGATION
    -------------------------------------------------------------------------- */
    // $('a[href^="#"]').on('click', function (e) {
    //     var target = $($(this).attr('href'));

    //     if (target.length) {
    //         e.preventDefault();
    //         $('html, body').stop().animate({
    //                 scrollTop: target.offset().top - 70
    //             },
    //             900,
    //             'easeInOutCubic'
    //         );

    //         $('#navLinks').removeClass('open');
    //         $('#navToggle').removeClass('open').attr('aria-expanded', 'false');
    //     }
    // });

    /* --------------------------------------------------------------------------
        MOBILE NAV TOGGLE
    -------------------------------------------------------------------------- */
    $('#navToggle').on('click', function () {
        var expanded = $(this).hasClass('open');
        $(this).toggleClass('open');
        $('#navLinks').toggleClass('open');
        $(this).attr('aria-expanded', String(!expanded));
    });

    /* --------------------------------------------------------------------------
        NAV: SOLID BACKGROUND ON SCROLL + ACTIVE LINK HIGHLIGHT
    -------------------------------------------------------------------------- */
    var $sections = $('section[id]');
    var $navLinks = $('.nav-link');

    function onScroll() {
        var scrollTop = $(window).scrollTop();

        // Nav background
        $('#siteNav').toggleClass('scrolled', scrollTop > 60);

        // Active link
        var current = '';

        $sections.each(function () {
            var top = $(this).offset().top - 120;
            if (scrollTop >= top) current = $(this).attr('id');
        });

        if (current) {
            $navLinks.removeClass('active');
            $navLinks.filter('[href="#' + current + '"]').addClass('active');
        }

        // Reveal-on-scroll elements
        revealOnScroll();

        // Hero parallax
        var heroOffset = scrollTop * 0.35;
        $('.hero-bg').css('transform', 'translateY(' + heroOffset + 'px)');
    }

    $(window).on('scroll', onScroll);
    onScroll();

    /* --------------------------------------------------------------------------
        SCROLL REVEAL ANIMATIONS
    -------------------------------------------------------------------------- */
    function revealOnScroll() {
        var windowBottom = $(window).scrollTop() + $(window).height();
        $('.reveal-on-scroll:not(.in-view)').each(function () {
            var elemTop = $(this).offset().top;
            if (elemTop < windowBottom - 100) {
                $(this).addClass('in-view');
            }
        });
    }

    /* --------------------------------------------------------------------------
        COUNTDOWN TIMER
    -------------------------------------------------------------------------- */
    (function initCountdown() {
        var $countdown = $('#countdown-timer');
        var weddingDate = new Date($countdown.data('wedding-date')).getTime();

        function tick() {
            var now = new Date().getTime();
            var distance = weddingDate - now;

            if (distance < 0) {
                $('#cd-days, #cd-hours, #cd-minutes, #cd-seconds').text('00');
                clearInterval(timer);
                return;
            }

            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            $('#cd-days').text(String(days).padStart(2, '0'));
            $('#cd-hours').text(String(hours).padStart(2, '0'));
            $('#cd-minutes').text(String(minutes).padStart(2, '0'));
            $('#cd-seconds').text(String(seconds).padStart(2, '0'));
        }

        tick();

        var timer = setInterval(tick, 1000);
    })();

    /* --------------------------------------------------------------------------
        GALLERY LIGHTBOX
    -------------------------------------------------------------------------- */
    (function initLightbox() {
        var images = $('.gallery-item img').map(function () {
            return $(this).attr('src');
        }).get();

        var currentIndex = 0;
        var $lightbox = $('#lightbox');
        var $lightboxImage = $('#lightboxImage');

        function openLightbox(index) {
            currentIndex = index;
            $lightboxImage.attr('src', images[currentIndex]);
            $lightbox.addClass('open');
            $('body').css('overflow', 'hidden');
        }

        function closeLightbox() {
            $lightbox.removeClass('open');
            $('body').css('overflow', '');
        }

        function showRelative(delta) {
            currentIndex = (currentIndex + delta + images.length) % images.length;
            $lightboxImage.attr('src', images[currentIndex]);
        }

        $('.gallery-item').on('click', function () {
            openLightbox($('.gallery-item').index(this));
        });

        $('#lightboxClose').on('click', closeLightbox);

        $('#lightboxPrev').on('click', function () {
            showRelative(-1);
        });

        $('#lightboxNext').on('click', function () {
            showRelative(1);
        });

        $lightbox.on('click', function (e) {
            if (e.target === this) closeLightbox();
        });

        $(document).on('keydown', function (e) {
            if (!$lightbox.hasClass('open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showRelative(-1);
            if (e.key === 'ArrowRight') showRelative(1);
        });
    })();

    /* --------------------------------------------------------------------------
        WISHES SECTION - AJAX SUBMIT + LOAD (backed by server.js + wishes.json)
    -------------------------------------------------------------------------- */
    // GET always reads the static wishes.json file - this works identically
    // whether it's served by server.js (npm start) or as a plain static file
    // on GitHub Pages, which has no server to run api/wishes against.
    var WISHES_JSON = 'wishes.json';
    // POST only works when server.js is actually running (local dev). On
    // GitHub Pages this 404s (no backend), so submissions fall back to
    // localStorage - see LOCAL_WISHES_KEY below.
    var WISHES_API = 'api/wishes';
    var LOCAL_WISHES_KEY = 'weddingWishesLocalFallback';

    // Used whenever the backend (server.js) can't be reached - e.g. index.html
    // was opened directly as a file:// page, or the site is hosted statically
    // on GitHub Pages with no Node server behind it.
    // Keeps the form usable, but these wishes stay on this device/browser only.
    function getLocalWishes() {
        try {
            var raw = window.localStorage.getItem(LOCAL_WISHES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function addLocalWish(wish) {
        var wishes = getLocalWishes();
        wishes.push(wish);
        try {
            window.localStorage.setItem(LOCAL_WISHES_KEY, JSON.stringify(wishes));
        } catch (e) {
            /* localStorage unavailable - ignore, nothing else we can do */
        }
        return wishes;
    }

    function escapeHtml(str) {
        return $('<div>').text(str).html();
    }

    function formatTime(isoString) {
        var d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function renderWishes(wishes, noteMessage) {
        var $list = $('#wishesList');
        $list.empty();

        if (noteMessage) {
            $list.append('<li class="wish-note">' + noteMessage + '</li>');
        }

        if (!wishes || wishes.length === 0) {
            $list.append('<li class="wish-empty">Be the first to leave a wish for the couple!</li>');
            return;
        }

        // Latest first
        var sorted = wishes.slice().sort(function (a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        sorted.forEach(function (wish) {
            var timeLabel = wish.createdAt ? formatTime(wish.createdAt) : '';
            var $item = $(
                '<li class="wish-item">' +
                '<span class="wish-name">' + escapeHtml(wish.name) + '</span>' +
                (timeLabel ? '<span class="wish-time">' + timeLabel + '</span>' : '') +
                '<p class="wish-content">' + escapeHtml(wish.content) + '</p>' +
                '</li>'
            );
            $list.append($item);
        });
    }

    function loadWishes() {
        $.ajax({
            url: WISHES_JSON,
            method: 'GET',
            dataType: 'json',
            cache: false
        }).done(function (data) {
            var local = getLocalWishes();
            var combined = (Array.isArray(data) ? data : []).concat(local);
            renderWishes(combined, local.length ? 'Some wishes below were saved on this device only (no live server to share them yet).' : '');
        }).fail(function (xhr) {
            console.error('Wishes GET failed:', xhr.status, xhr.statusText, xhr.responseText);
            // wishes.json itself couldn't be loaded - fall back to this device's local wishes only.
            renderWishes(getLocalWishes(), 'Unable to load shared wishes right now &mdash; showing wishes saved on this device only.');
        });
    }

    function setFieldError(fieldId, message) {
        var $field = $('#' + fieldId);
        var $row = $field.closest('.form-row');
        var $error = $('#' + fieldId + 'Error');
        if (message) {
            $row.addClass('has-error');
            $error.text(message);
        } else {
            $row.removeClass('has-error');
            $error.text('');
        }
    }

    function validateForm(name, content) {
        var valid = true;

        if (!name.trim()) {
            setFieldError('wishName', 'Please enter your name.');
            valid = false;
        } else {
            setFieldError('wishName', '');
        }

        if (!content.trim()) {
            setFieldError('wishContent', 'Please write a short message.');
            valid = false;
        } else {
            setFieldError('wishContent', '');
        }

        return valid;
    }

    $('#wishForm').on('submit', function (e) {
        e.preventDefault();

        var $form = $(this);
        var $status = $('#wishFormStatus');
        var $submitBtn = $('#wishSubmitBtn');
        var name = $('#wishName').val() || '';
        var content = $('#wishContent').val() || '';

        $status.text('').removeClass('success error');

        if (!validateForm(name, content)) {
            $status.addClass('error').text('Please fill in all required fields.');
            return;
        }
        $submitBtn.prop('disabled', true);

        $.ajax({
            url: WISHES_API,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name.trim(),
                content: content.trim()
            })
        }).done(function (data) {
            $status.addClass('success').text('Thank you! Your wish has been shared.');
            $form.trigger('reset');
            renderWishes((data.wishes || []).concat(getLocalWishes()));
        }).fail(function (xhr) {
            console.error('Wishes POST failed:', xhr.status, xhr.statusText, xhr.responseText);
            // status 0 = no server reachable at all (file:// or offline); 404 = no
            // api/wishes route (e.g. GitHub Pages static hosting, no backend).
            // Both mean "no backend to save to" - fall back to localStorage.
            if (xhr.status === 0 || xhr.status === 404 || xhr.status === 404 || xhr.status === 405) {
                addLocalWish({
                    name: name.trim(),
                    content: content.trim(),
                    createdAt: new Date().toISOString()
                });
                $status.addClass('success').text('This site has no live server, so your wish was saved on this device only (not shared with other guests).');
                $form.trigger('reset');
                loadWishes();
                return;
            }

            var message = (xhr.responseJSON && xhr.responseJSON.message) ||
                'Server responded with an error (HTTP ' + xhr.status + '). Open the browser console for details.';
            $status.addClass('error').text(message);
        }).always(function () {
            $submitBtn.prop('disabled', false);
        });
    });





    loadWishes();

    /* --------------------------------------------------------------------------
        FOOTER YEAR
    -------------------------------------------------------------------------- */
    $('#footerYear').text(new Date().getFullYear());
});